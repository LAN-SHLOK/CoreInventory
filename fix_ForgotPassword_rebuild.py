# -*- coding: utf-8 -*-
filepath = r'c:\Project\CoreInventory\core_api\identity\views.py'
with open(filepath, 'r') as f:
    content = f.read()

search_start = 'class ForgotPasswordView(APIView):'
search_end = 'class VerifyResetCodeView(APIView):'

ideal_view = '''class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            email = request.data.get('email', '').strip()

            if not email:
                return Response(
                    {'detail': 'Email is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Use .filter().first() to handle cases with duplicate emails safely
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                # Security: don't reveal if email exists
                return Response(
                    {'detail': 'If this email exists, a reset code has been sent.'},
                    status=status.HTTP_200_OK
                )

            # Delete old unused OTPs
            PasswordResetOTP.objects.filter(user=user, is_used=False).delete()

            # Generate new OTP
            otp = PasswordResetOTP.generate_otp()
            PasswordResetOTP.objects.create(user=user, otp=otp)

            # --- PROFESSIONAL COMPANY EMAIL TEMPLATE ---
            subject = 'CoreInventory - Password Reset Request'
            year = timezone.now().year if hasattr(timezone, 'now') else 2026
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>CoreInventory Password Reset</title>
            </head>
            <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; color: #333333;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; max-width: 600px; margin: 0 auto;">
                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #0f172a; padding: 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">CoreInventory</h1>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #475569;">
                                            Hello <strong>{user.first_name or user.username}</strong>,
                                        </p>
                                        <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.5; color: #475569;">
                                            We received a request to reset your password for your CoreInventory account. To proceed, please use the secure authentication code below:
                                        </p>
                                        
                                        <!-- Code Box -->
                                        <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 30px;">
                                            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">{otp}</span>
                                        </div>
                                        
                                        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #64748b;">
                                            <em>This code is valid for exactly <strong>10 minutes</strong>. After that, you will need to request a new one.</em>
                                        </p>
                                        
                                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                                        
                                        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #475569;">
                                            If you did not initiate this request, please ignore this email or contact your system administrator if you have concerns. Your password will remain unchanged.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                            &copy; {year} CoreInventory Management Systems. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """

            # Using standard Django send_mail
            from django.core.mail import send_mail
            from django.conf import settings
            send_mail(
                subject=subject,
                message=f"Your reset code is: {otp}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_content,
                fail_silently=False,
            )
            print(f"SMTP email sent successfully to {user.email}")
            
            return Response(
                {'detail': 'If this email exists, a reset code has been sent.'},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            # Catch SMTP Errors, DB Errors, etc.
            print("\\n" + "!"*50)
            print(f"CRITICAL: Error in ForgotPassword for {email}: {e}")
            print("!"*50 + "\\n")
            return Response(
                {'detail': f'Diagnostics Error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

'''

start_idx = content.find(search_start)
end_idx = content.find(search_end)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + ideal_view + content[end_idx:]
    with open(filepath, 'w') as f:
        f.write(new_content)
    print("Reconstruction successful!")
else:
    print("Could not find start/end markers in file.")
