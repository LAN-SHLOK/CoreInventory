from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient  # pyright: ignore [missing-import]
from rest_framework import status  # pyright: ignore [missing-import]  
from .models import Profile, PasswordResetOTP

class IdentityModelTests(TestCase):
    def test_user_profile_creation(self):
        # When a user is created, a profile should be created automatically via signal
        user = User.objects.create_user(username='testuser', email='test@test.com', password='password123')
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.role, 'staff')

    def test_admin_profile_creation(self):
        # The specific 'AdminID' user gets the admin role
        admin_user = User.objects.create_user(username='AdminID', email='admin@test.com', password='password123')
        self.assertEqual(admin_user.profile.role, 'admin')

    def test_otp_generation_and_expiry(self):
        user = User.objects.create_user(username='otpuser', email='otp@test.com', password='password123')
        otp_code = PasswordResetOTP.generate_otp()
        
        self.assertEqual(len(otp_code), 6)
        self.assertTrue(otp_code.isdigit())
        
        otp_obj = PasswordResetOTP.objects.create(user=user, otp=otp_code)
        self.assertFalse(otp_obj.is_used)
        self.assertFalse(otp_obj.is_expired())

class IdentityAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='apiuser', email='api@test.com', password='password123')

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'apiuser',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_failure(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'apiuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'], 'Incorrect password.')

    def test_registration(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'User'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
