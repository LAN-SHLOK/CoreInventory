from django.db.models import F
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import Warehouse, Location, Product, StockMovement
from .serializers import (
    WarehouseSerializer, LocationSerializer, 
    ProductSerializer, StockMovementSerializer
)
from .permissions import IsManagerOrReadOnly

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]
    
    # The Search Engine
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category'] 
    search_fields = ['name', 'sku'] 

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-date')
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    # The PDF Requirement: Dynamic Filters
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['movement_type', 'status', 'source__warehouse', 'destination__warehouse']

    def perform_create(self, serializer):
        # ... (Keep Aryan's math logic exactly as it is here!)
        pass

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def kpis(self, request):
        total_products = Product.objects.count()
        
        # SMART CALCULATION: Compares current_stock directly against its own reorder_level!
        low_stock = Product.objects.filter(current_stock__lte=F('reorder_level')).count() 
        
        total_movements = StockMovement.objects.count()
        
        return Response({
            "total_products": total_products,
            "low_stock_alerts": low_stock,
            "total_movements": total_movements
        })