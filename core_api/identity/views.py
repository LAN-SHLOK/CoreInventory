from django.contrib.auth.models import User
from django.db.models import Q
from django.conf import settings
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

        refresh = RefreshToken.for_user(user)
        refresh['username'] = user.username
        refresh['email'] = user.email
        refresh['role'] = (
            'manager' if user.groups.filter(name='Manager').exists() else 'staff'
        )

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
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

        # --- INTEGRATED BREVO API LOGIC ---
        subject = 'CoreInventory — Your Password Reset Code'
        html_content = f'''
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2d89ef;">Password Reset Request</h2>
                <p>Hi {user.first_name or user.username},</p>
                <p>You requested a password reset for your CoreInventory account. Use the code below to proceed:</p>
                <div style="background: #f4f4f4; padding: 15px; font-size: 1.5em; text-align: center; letter-spacing: 5px; font-weight: bold; border-radius: 5px;">
                    {otp}
                </div>
                <p>This code <strong>expires in 10 minutes</strong>.</p>
                <p>If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8em; color: #888;">— The CoreInventory Team</p>
            </div>
        '''

        try:
            # Using your utility function instead of send_mail
            send_brevo_email(
                subject=subject,
                html_content=html_content,
                to_email=user.email,
                to_name=user.username
            )
        except Exception as e:
            # Log the error to your terminal for debugging
            print(f"Brevo API Error: {e}")
            return Response(
                {'detail': 'Failed to send reset code. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {'detail': 'If this email exists, a reset code has been sent.'},
            status=status.HTTP_200_OK
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