from django.db import models
from django.contrib.auth.models import User
import random, string
from django.utils import timezone
from datetime import timedelta

class Location(models.Model):
    name = models.CharField(max_length=100)
    is_internal = models.BooleanField(default=True, help_text="False for Suppliers/Customers")

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=100)
    unit_of_measure = models.CharField(max_length=20, help_text="e.g., kg, units, liters")

    def __str__(self):
        return f"{self.sku} - {self.name}"

class StockLedger(models.Model):
    MOVEMENT_TYPES = [
        ('RECEIPT', 'Receipt'),
        ('DELIVERY', 'Delivery'),
        ('TRANSFER', 'Transfer'),
        ('ADJUSTMENT', 'Adjustment')
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    source_location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, related_name='outgoing_stock')
    destination_location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, related_name='incoming_stock')
    quantity = models.IntegerField(help_text="Positive number for the amount moved")
    timestamp = models.DateTimeField(auto_now_add=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.movement_type} of {self.quantity} {self.product.unit_of_measure} {self.product.name}"

# ── Password Reset OTP ────────────────────────────────
class PasswordResetOTP(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    otp        = models.CharField(max_length=6)
    token      = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used    = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    @staticmethod
    def generate_otp():
        return ''.join(random.choices(string.digits, k=6))

    @staticmethod
    def generate_token():
        return ''.join(random.choices(string.ascii_letters + string.digits, k=64))

    def __str__(self):
        return f"{self.user.username} - {self.otp}"