const express = require("express");
const axios = require("axios");
const AWS = require("aws-sdk");
const { Pool } = require("pg"); // <--- NEW: PostgreSQL Client

const app = express();
app.use(express.json());

// 1. Connect to our new separated database
const pool = new Pool({
  // e.g., postgres://db_user:db_pass@pg:5432/ecommerce_orders
  connectionString: process.env.ORDER_DB_URL 
});

const sns = new AWS.SNS({ region: "us-east-1" });
const HYPERSWITCH_URL = "http://hyperswitch-backend:8080/payments";

// 2. The Endpoint called by your React Frontend
app.post("/create-checkout", async (req, res) => {
  const { customer_id, items } = req.body;
  const amount = 5000; // Calculate based on items
  
  try {
    // NEW: Save the order as 'PENDING' in our custom database first
    const dbResult = await pool.query(
      "INSERT INTO orders (customer_id, total_amount, status) VALUES ($1, $2, 'PENDING') RETURNING id",
      [customer_id, amount]
    );
    const internalOrderId = dbResult.rows[0].id;

    // Now tell Hyperswitch to process the payment for this specific Order ID
    const response = await axios.post(HYPERSWITCH_URL, {
      amount: amount,
      currency: "USD",
      customer_id: customer_id,
      metadata: { order_id: internalOrderId } // Attach our DB ID to the payment!
    }, {
      headers: { "api-key": process.env.HYPERSWITCH_API_KEY }
    });

    res.json({ clientSecret: response.data.client_secret, orderId: internalOrderId });
  } catch (error) {
    console.error("Failed to create order:", error.message);
    res.status(500).json({ error: "Failed to initialize checkout." });
  }
});


// 3. The Webhook endpoint called by Hyperswitch
app.post("/webhook", async (req, res) => {
  const event = req.body;

  if (event.type === "payment_intent.succeeded") {
    // We retrieve the Order ID that we sent in step 2
    const internalOrderId = event.data.object.metadata.order_id;

    // NEW: Update our custom database to mark the order as PAID
    await pool.query("UPDATE orders SET status = 'PAID' WHERE id = $1", [internalOrderId]);

    // Publish to AWS SNS so Inventory/Notification services can do their job
    const snsParams = {
      Message: JSON.stringify({
        orderId: internalOrderId,
        status: "PAID",
        customerEmail: "customer@example.com"
      }),
      TopicArn: process.env.SNS_PAYMENT_SUCCESS_TOPIC_ARN
    };
    
    await sns.publish(snsParams).promise();
    console.log(`Order ${internalOrderId} marked as PAID and published to SNS!`);
  }

  res.status(200).send("Webhook received");
});

app.listen(3000, () => console.log("Order Service running on port 3000"));
