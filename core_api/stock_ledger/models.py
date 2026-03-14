from django.db import models
from django.contrib.auth.models import User

class Warehouse(models.Model):
    """The PDF mentions 'Warehouse' specifically for filtering."""
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Location(models.Model):
    """Specific spots inside a Warehouse (e.g., Shelf A, Bin 10)."""
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='locations')
    name = models.CharField(max_length=100)
    is_internal = models.BooleanField(default=True, help_text="False for Suppliers/Customers")

    def __str__(self):
        return f"{self.warehouse.name} - {self.name}"

class Product(models.Model):
    """Core requirements: Name, SKU, Category, UoM."""
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=100)
    unit_of_measure = models.CharField(max_length=20, help_text="e.g., kg, pcs, liters")
    current_stock = models.IntegerField(default=0) # Quick lookup for Dashboard

    def __str__(self):
        return f"[{self.sku}] {self.name}"

class StockMovement(models.Model):
    """
    Captures the 4 Operations: Receipts, Delivery, Internal Transfer, Adjustment.
    Includes 'Document Reference' and 'Status' as per PDF requirements.
    """
    TYPE_CHOICES = [
        ('RECEIPT', 'Receipt'),
        ('DELIVERY', 'Delivery'),
        ('TRANSFER', 'Internal Transfer'),
        ('ADJUSTMENT', 'Stock Adjustment'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('DONE', 'Done'),
        ('CANCELLED', 'Cancelled'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DONE')
    
    # PDF Requirement: Document Reference (e.g., Invoice #, PO #)
    reference = models.CharField(max_length=100, blank=True, null=True)
    
    # Source/Destination for Transfers and tracking
    source = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_out')
    destination = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_in')
    
    quantity = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True) # PDF Requirement: Filter by Date
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.movement_type} - {self.product.sku} ({self.quantity})"