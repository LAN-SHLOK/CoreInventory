import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from django.conf import settings

def send_brevo_email(subject, html_content, to_email, to_name="User"):
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = settings.BREVO_API_KEY
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    # Ensure this email is verified in your Brevo Dashboard
    sender = {"name": "CoreInventory", "email": "a4e8cb001@smtp-brevo.com"}
    to = [{"email": to_email, "name": to_name}]
    
    send_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        html_content=html_content,
        sender=sender,
        subject=subject
    )

    try:
        api_response = api_instance.send_transac_email(send_email)
        print(f"Brevo API Success: {api_response}")
        return api_response
    except ApiException as e:
        print(f"Brevo API Exception: {e}")
        # Re-raise to let the view handle it if needed, or return None
        raise e