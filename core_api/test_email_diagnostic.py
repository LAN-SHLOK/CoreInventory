import os
from decouple import config
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

# Load config
BREVO_API_KEY = config('BREVO_API_KEY', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='')

print(f"API Key present: {'Yes' if BREVO_API_KEY else 'No'}")
print(f"From Email: {DEFAULT_FROM_EMAIL}")

def test_send(to_email):
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    sender = {"name": "CoreInventory", "email": DEFAULT_FROM_EMAIL}
    to = [{"email": to_email}]
    subject = "Diagnostic Test"
    html_content = "<html><body><h1>Diagnostic Test</h1><p>Testing email delivery.</p></body></html>"
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        html_content=html_content,
        sender=sender,
        subject=subject
    )

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Success for {to_email}: {api_response}")
    except ApiException as e:
        print(f"Exception for {to_email}: {e}")

if __name__ == "__main__":
    emails = ['shlokpatel699@gmail.com', 'bhavyadoriya@gmail.com']
    for email in emails:
        test_send(email)
