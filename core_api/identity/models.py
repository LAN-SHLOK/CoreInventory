import random
import string
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
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


class Profile(models.Model):
    ROLE_CHOICES = (
        ('admin',   'Admin'),
        ('manager', 'Inventory Manager'),
        ('staff',   'Warehouse Staff'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')

    def __str__(self):
        return f"{self.user.username} ({self.role})"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Default AdminID to 'admin' role
        role = 'admin' if instance.username == 'AdminID' or instance.is_staff else 'staff'
        Profile.objects.create(user=instance, role=role)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        # Fallback if profile doesn't exist for some reason
        role = 'admin' if instance.username == 'AdminID' or instance.is_staff else 'staff'
        Profile.objects.create(user=instance, role=role)