import random
import string
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

# --- Password Reset OTP ---
# This belongs in Identity because it's part of User Authentication
class PasswordResetOTP(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    otp        = models.CharField(max_length=6)
    token      = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used    = models.BooleanField(default=False)

    def is_expired(self):
        # OTP is valid for 10 minutes
        return timezone.now() > self.created_at + timedelta(minutes=10)

    @staticmethod
    def generate_otp():
        return ''.join(random.choices(string.digits, k=6))

    @staticmethod
    def generate_token():
        return ''.join(random.choices(string.ascii_letters + string.digits, k=64))

    def __str__(self):
        return f"{self.user.username} - {self.otp}"

# NOTE: I have removed Location, Product, and StockLedger from here.
# They should stay in your 'stock_ledger/models.py' file to keep the 
# project architecture clean as we discussed.