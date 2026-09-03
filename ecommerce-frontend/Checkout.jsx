import React, { useState, useEffect } from "react";
import { loadHyper } from "@juspay-tech/hyper-js";
import { UnifiedCheckout } from "@juspay-tech/react-hyper-js";

// Initialize the SDK with your Publishable Key
const hyperPromise = loadHyper("pk_snd_your_publishable_key_here");

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // 1. Call YOUR custom Order Service to create the order
    fetch("http://api.yourdomain.com/order-service/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: "shoe_123", qty: 1 }] }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret)); // The Order Service got this from Hyperswitch
  }, []);

  const appearance = {
    theme: "midnight", // Customize the SDK look here
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="checkout-container">
      <h1>Complete Your Purchase</h1>
      
      {/* 2. Render the Hyperswitch SDK once we have the secret */}
      {clientSecret ? (
        <UnifiedCheckout stripe={hyperPromise} options={options} />
      ) : (
        <p>Loading secure checkout...</p>
      )}
    </div>
  );
}
