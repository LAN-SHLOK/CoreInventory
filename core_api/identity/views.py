from django.contrib.auth.models import User
from django.db.models import Q
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer
from .utils import send_brevo_email
from .models import PasswordResetOTP
from .utils import send_brevo_email # Crucial for API delivery

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer


class FlexLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        identifier = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        if not identifier or not password:
            return Response(
                {'detail': 'Username/email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(
                Q(username__iexact=identifier) | Q(email__iexact=identifier)
            )
        except User.DoesNotExist:
            return Response(
                {'detail': 'No account found with that username or email.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except User.MultipleObjectsReturned:
            user = User.objects.filter(username__iexact=identifier).first()
            if not user:
                return Response(
                    {'detail': 'No account found with that username or email.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        if not user.check_password(password):
            return Response(
                {'detail': 'Incorrect password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'This account is disabled.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get profile role
        profile = getattr(user, 'profile', None)
        user_role = profile.role if profile else ('admin' if user.is_staff else 'staff')

        refresh = RefreshToken.for_user(user)
        refresh['username'] = user.username
        refresh['email']    = user.email
        refresh['is_staff'] = user.is_staff
        refresh['role']     = user_role

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class ForgotPasswordView(APIView):
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
            print("\n" + "!"*50)
            print(f"CRITICAL: Error in ForgotPassword for {email}: {e}")
            print("!"*50 + "\n")
            return Response(
                {'detail': f'Diagnostics Error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyResetCodeView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip()
        code = request.data.get('code', '').strip()

        if not email or not code:
            return Response(
                {'detail': 'Email and code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use .filter().first() to handle cases with duplicate emails safely
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {'detail': 'Invalid or expired code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp_obj = PasswordResetOTP.objects.filter(
            user=user,
            otp=code,
            is_used=False
        ).order_by('-created_at').first()

        if not otp_obj:
            return Response(
                {'detail': 'Invalid or expired code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_obj.is_expired():
            return Response(
                {'detail': 'This code has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate reset token
        token = PasswordResetOTP.generate_token()
        otp_obj.token = token
        otp_obj.save()

        return Response({'token': token}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        token = request.data.get('token', '').strip()
        password = request.data.get('password', '').strip()

        if not token or not password:
            return Response(
                {'detail': 'Token and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 8:
            return Response(
                {'detail': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp_obj = PasswordResetOTP.objects.filter(
            token=token,
            is_used=False
        ).order_by('-created_at').first()

        if not otp_obj:
            return Response(
                {'detail': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_obj.is_expired():
            return Response(
                {'detail': 'Reset link has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user = otp_obj.user
        user.set_password(password)
        user.save()

        # Mark OTP as used
        otp_obj.is_used = True
        otp_obj.save()

        return Response(
            {'detail': 'Password reset successful.'},
            status=status.HTTP_200_OK
        )