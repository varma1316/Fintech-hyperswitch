from fastapi import FastAPI, Request, HTTPException
import json
import logging

app = FastAPI(title="Inventory Service")
logging.basicConfig(level=logging.INFO)

# Mock database
inventory_db = {
    "shoe_123": {"stock": 100, "name": "Running Shoes"}
}

@app.post("/sqs-worker/process-payment")
async def process_payment_event(request: Request):
    """
    This endpoint is triggered by an SQS worker when a message arrives 
    from the PaymentSucceeded SNS topic.
    """
    try:
        body = await request.json()
        message = json.loads(body.get("Message", "{}"))
        
        order_id = message.get("orderId")
        items = message.get("items", [])
        
        logging.info(f"Processing inventory deduction for Order: {order_id}")
        
        for item in items:
            item_id = item.get("id")
            qty = item.get("qty")
            
            if item_id in inventory_db and inventory_db[item_id]["stock"] >= qty:
                inventory_db[item_id]["stock"] -= qty
                logging.info(f"Deducted {qty} of {item_id}. Remaining stock: {inventory_db[item_id]['stock']}")
            else:
                logging.error(f"Insufficient stock for {item_id}!")
                # In a real app, you would publish a 'PaymentRefundRequired' event here
                
        return {"status": "success"}

    except Exception as e:
        logging.error(f"Failed to process message: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
