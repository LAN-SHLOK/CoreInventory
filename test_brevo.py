import os
import sys

# Add the core_api directory to sys.path to import settings
sys.path.append(r'c:\Project\CoreInventory\core_api')

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')

import django
django.setup()

from django.conf import settings
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

def test_email():
    print(f"Using BREVO_API_KEY: {settings.BREVO_API_KEY[:10]}...")
    print(f"Using DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = settings.BREVO_API_KEY
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    sender = {"name": "CoreInventory", "email": settings.DEFAULT_FROM_EMAIL}
    to = [{"email": "shlokpatel699@gmail.com", "name": "Test User"}]
    
    send_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        html_content="<p>Test email from scratch script.</p>",
        sender=sender,
        subject="Test Email"
    )

    try:
        api_response = api_instance.send_transac_email(send_email)
        print(f"API Response: {api_response}")
    except ApiException as e:
        print(f"ApiException: {e}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_email()
