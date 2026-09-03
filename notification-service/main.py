from fastapi import FastAPI, Request
import json
import logging
import smtplib
from email.message import EmailMessage

app = FastAPI(title="Notification Service")
logging.basicConfig(level=logging.INFO)

# Connects to the local MailHog container defined in docker-compose.yml
SMTP_SERVER = "mailhog"
SMTP_PORT = 1025

def send_email_receipt(customer_email: str, order_id: str):
    msg = EmailMessage()
    msg.set_content(f"Thank you for your purchase! Your order {order_id} has been successfully paid.")
    msg['Subject'] = f"Receipt for Order {order_id}"
    msg['From'] = "billing@ecommerce.com"
    msg['To'] = customer_email

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.send_message(msg)
        logging.info(f"Successfully sent receipt email to {customer_email}")
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")

@app.post("/sqs-worker/send-notification")
async def process_notification_event(request: Request):
    """
    This endpoint is triggered by an SQS worker when a message arrives 
    from the PaymentSucceeded SNS topic.
    """
    body = await request.json()
    message = json.loads(body.get("Message", "{}"))
    
    order_id = message.get("orderId")
    customer_email = message.get("customerEmail")
    
    if customer_email and order_id:
        send_email_receipt(customer_email, order_id)
        
    return {"status": "email_sent"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
