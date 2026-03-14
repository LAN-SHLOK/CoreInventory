from django.db import models
from django.contrib.auth.models import User

class Location(models.Model):    # This handles Warehouse 1, Warehouse 2, Production Rack, etc.
    name = models.CharField(max_length=100)
    is_internal = models.BooleanField(default=True, help_text="False for Suppliers/Customers")

    def __str__(self):
        return self.name

class Product(models.Model):
    # Core Product Management
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=100)
    unit_of_measure = models.CharField(max_length=20, help_text="e.g., kg, units, liters")
    
    def __str__(self):
        return f"{self.sku} - {self.name}"

class StockLedger(models.Model):
    MOVEMENT_TYPES = [
        ('RECEIPT', 'Receipt'),       # Incoming Stock
        ('DELIVERY', 'Delivery'),     # Outgoing Stock
        ('TRANSFER', 'Transfer'),     # Internal Movement
        ('ADJUSTMENT', 'Adjustment')  # Fixing mismatches
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    
    # Where is it coming from and going to?
    source_location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, related_name='outgoing_stock')
    destination_location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, related_name='incoming_stock')
    
    quantity = models.IntegerField(help_text="Positive number for the amount moved")
    timestamp = models.DateTimeField(auto_now_add=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.movement_type} of {self.quantity} {self.product.unit_of_measure} {self.product.name}"