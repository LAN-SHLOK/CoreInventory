from rest_framework import serializers
from .models import Warehouse, Location, Product, StockMovement

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'

class LocationSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = Location
        fields = ['id', 'warehouse', 'warehouse_name', 'name', 'is_internal']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category', 'unit_of_measure', 'current_stock']

class StockMovementSerializer(serializers.ModelSerializer):
    # These 'source' fields let the frontend see "Shelf A" instead of just ID "5"
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    source_name = serializers.CharField(source='source.name', read_only=True)
    dest_name = serializers.CharField(source='destination.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'