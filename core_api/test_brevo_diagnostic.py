import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
import os
from decouple import config

def test_email():
    # Load from .env
    api_key = config('BREVO_API_KEY')
    sender_email = config('DEFAULT_FROM_EMAIL')
    
    print(f"Testing with Sender: {sender_email}")
    print(f"API Key start: {api_key[:10]}...")

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    sender = {"name": "CoreInventory Test", "email": sender_email}
    to = [{"email": "shlokpatel699@gmail.com", "name": "Shlok Test"}] 
    subject = "Diagnostic Test Email - Cross Domain"
    html_content = "<html><body><h1>It works!</h1><p>If you see this, Brevo is configured correctly.</p></body></html>"
    
    send_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        html_content=html_content,
        sender=sender,
        subject=subject
    )

    try:
        api_response = api_instance.send_transac_email(send_email)
        print("\nSUCCESS!")
        print(f"API Response: {api_response}")
    except ApiException as e:
        print("\nFAILED!")
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}")
    except Exception as e:
        print(f"\nOther error: {e}")

if __name__ == "__main__":
    test_email()
