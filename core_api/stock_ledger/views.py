from django.forms import ValidationError
from django.shortcuts import render
from rest_framework import viewsets, permissions, filters # Added filters
from django_filters.rest_framework import DjangoFilterBackend # New import
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Warehouse, Location, Product, StockMovement
from .serializers import (
    WarehouseSerializer, LocationSerializer, 
    ProductSerializer, StockMovementSerializer
)
from rest_framework import status
from django.db import transaction
from django.db.models import Sum
from rest_framework import filters

# Create your views here.
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
    
    # The Search Engine
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category'] # Lets frontend filter by Raw Material, etc.
    search_fields = ['name', 'sku'] # Lets frontend type "Steel" and find it

    # 1. RECEIPT (Incoming Stock)
    @action(detail=True, methods=['post'])
    def receive_stock(self, request, pk=None):
        product = self.get_object()
        quantity = request.data.get('quantity')
        reference = request.data.get('reference', '') # e.g., PO-1029
        destination_id = request.data.get('destination_id') # Where is it going?

        if not quantity or int(quantity) <= 0:
            return Response({"error": "Quantity must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                qty = int(quantity)
                product.current_stock += qty
                product.save()

                # Fetch location if provided
                dest_location = Location.objects.filter(id=destination_id).first() if destination_id else None

                StockMovement.objects.create(
                    product=product,
                    movement_type='RECEIPT',
                    status='DONE',
                    quantity=qty,
                    reference=reference,
                    destination=dest_location,
                    user=request.user if request.user.is_authenticated else None
                )
            return Response({"status": "Receipt successful", "new_stock": product.current_stock})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 2. DELIVERY (Outgoing Stock)
    @action(detail=True, methods=['post'])
    def deliver_stock(self, request, pk=None):
        product = self.get_object()
        quantity = request.data.get('quantity')
        reference = request.data.get('reference', '') # e.g., INV-992
        source_id = request.data.get('source_id') # Where is it leaving from?

        if not quantity or int(quantity) <= 0:
            return Response({"error": "Quantity must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                qty = int(quantity)
                if product.current_stock < qty:
                    return Response({"error": f"Insufficient stock. Only {product.current_stock} available."}, status=status.HTTP_400_BAD_REQUEST)

                product.current_stock -= qty
                product.save()

                source_location = Location.objects.filter(id=source_id).first() if source_id else None

                StockMovement.objects.create(
                    product=product,
                    movement_type='DELIVERY',
                    status='DONE',
                    quantity=-qty, # Negative for outgoing
                    reference=reference,
                    source=source_location,
                    user=request.user if request.user.is_authenticated else None
                )
            return Response({"status": "Delivery successful", "new_stock": product.current_stock})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 3. TRANSFER (Moving inside the warehouse)
    @action(detail=True, methods=['post'])
    def transfer_stock(self, request, pk=None):
        product = self.get_object()
        quantity = request.data.get('quantity')
        source_id = request.data.get('source_id')
        destination_id = request.data.get('destination_id')

        if not quantity or int(quantity) <= 0:
            return Response({"error": "Quantity must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)
        if not source_id or not destination_id:
            return Response({"error": "Both source_id and destination_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                qty = int(quantity)
                # NOTE: Total stock does NOT change during an internal transfer!
                
                source_location = Location.objects.filter(id=source_id).first()
                dest_location = Location.objects.filter(id=destination_id).first()

                StockMovement.objects.create(
                    product=product,
                    movement_type='TRANSFER',
                    status='DONE',
                    quantity=qty,
                    source=source_location,
                    destination=dest_location,
                    user=request.user if request.user.is_authenticated else None
                )
            return Response({"status": "Transfer logged successfully", "total_stock": product.current_stock})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 4. ADJUSTMENT (Physical Count Correction)
    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        physical_count = request.data.get('physical_count')
        reference = request.data.get('reference', 'Monthly Audit')

        if physical_count is None or int(physical_count) < 0:
            return Response({"error": "Valid physical count required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                physical_count = int(physical_count)
                variance = physical_count - product.current_stock
                
                product.current_stock = physical_count
                product.save()

                StockMovement.objects.create(
                    product=product,
                    movement_type='ADJUSTMENT',
                    status='DONE',
                    quantity=variance,
                    reference=reference,
                    user=request.user if request.user.is_authenticated else None
                )
            return Response({"status": "Adjustment successful", "variance": variance, "new_stock": product.current_stock})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 5. DASHBOARD STATS API
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        total_products = Product.objects.count()
        low_stock_items = Product.objects.filter(current_stock__lt=10).count()
        total_stock = Product.objects.aggregate(Sum('current_stock'))['current_stock__sum'] or 0
        
        return Response({
            "total_products": total_products,
            "low_stock_items": low_stock_items,
            "total_stock_on_hand": total_stock
        }, status=status.HTTP_200_OK)

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-date')
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    # THE MAGIC: Adding Search and Filters
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    
    # Exact Match Filters (Dropdowns on the frontend)
    filterset_fields = ['movement_type', 'status', 'product__id']
    
    # Search Bar Filters (Typing text on the frontend)
    search_fields = ['reference', 'product__name', 'product__sku']

    def perform_create(self, serializer):
        # 1. Extract the data the frontend sent before saving
        movement_type = serializer.validated_data.get('movement_type')
        quantity = serializer.validated_data.get('quantity')
        product = serializer.validated_data.get('product')

        # 2. Safety First: No negative quantities allowed in the input
        if quantity <= 0 and movement_type != 'ADJUSTMENT':
            raise ValidationError({"quantity": "Must be greater than zero."})

        # 3. The Math Engine (Wrapped in atomic to prevent ghost inventory)
        try:
            with transaction.atomic():
                if movement_type == 'RECEIPT':
                    product.current_stock += quantity
                
                elif movement_type == 'DELIVERY':
                    if product.current_stock < quantity:
                        raise ValidationError({"error": f"Insufficient stock. Only {product.current_stock} available."})
                    product.current_stock -= quantity
                
                elif movement_type == 'TRANSFER':
                    # Global stock doesn't change, but we must ensure both source and destination exist
                    source = serializer.validated_data.get('source')
                    destination = serializer.validated_data.get('destination')
                    if not source or not destination:
                        raise ValidationError({"error": "Transfers require both source and destination locations."})
                    # (If you track stock strictly per location, that math goes here)
                
                elif movement_type == 'ADJUSTMENT':
                    # For adjustments, the frontend should send the physical count as the 'quantity'.
                    # We calculate the variance, update the stock, and log the variance.
                    variance = quantity - product.current_stock
                    product.current_stock = quantity
                    # We overwrite the serializer's quantity to save the variance in the ledger
                    serializer.validated_data['quantity'] = variance 

                # 4. Save the new stock count to the Product table
                product.save()

                # 5. Save the Movement Ledger entry (Bhavya's auto-reference logic will trigger here)
                # We attach the logged-in user to the record automatically
                serializer.save(user=self.request.user)

        except Exception as e:
            raise ValidationError({"error": str(e)})