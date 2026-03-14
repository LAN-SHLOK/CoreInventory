from django.contrib import admin
from .models import Location, Product, StockLedger

@admin.register(Product)
class ProductAdmin(admin.register):
    list_display = ('sku', 'name', 'category')

admin.site.register(Location)
admin.site.register(StockLedger)