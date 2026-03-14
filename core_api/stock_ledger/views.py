from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import Warehouse, Location, Product, StockMovement
from .serializers import (
    WarehouseSerializer, LocationSerializer, 
    ProductSerializer, StockMovementSerializer
)

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    # This ensures only logged-in people can see the data
    permission_classes = [permissions.IsAuthenticated]

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-date')
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]