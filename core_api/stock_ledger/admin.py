from django.contrib import admin
from .models import Warehouse, Location, Product, StockMovement

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'address')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'warehouse', 'is_internal')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'category', 'current_stock')
    search_fields = ('sku', 'name')

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('movement_type', 'product', 'quantity', 'status', 'date')
    list_filter = ('movement_type', 'status', 'date')