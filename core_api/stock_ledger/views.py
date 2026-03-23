from django.forms import ValidationError
from django.shortcuts import render
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Warehouse, Location, Product, StockMovement
from .serializers import (
    WarehouseSerializer, LocationSerializer, 
    ProductSerializer, StockMovementSerializer
)
from rest_framework import status
from django.db import transaction, models
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from rest_framework import filters

# Create your views here.
class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow AdminID (staff) to edit objects.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to staff users (like AdminID)
        return request.user and request.user.is_authenticated and request.user.is_staff

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    # This ensures only logged-in people can see, but only staff (AdminID) can modify
    permission_classes = [IsAdminOrReadOnly]

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAdminOrReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    
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

                # Validate: cannot transfer more than available hand-on stock
                if product.current_stock < qty:
                    return Response(
                        {"error": f"Insufficient stock. Only {product.current_stock} available for transfer."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

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

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        doc_type = request.query_params.get('type')
        status_filter = request.query_params.get('status')
        location_id = request.query_params.get('location')
        category_id = request.query_params.get('category')

        # Base querysets
        stock_movements = StockMovement.objects.all()
        products = Product.objects.all()

        if location_id:
            stock_movements = stock_movements.filter(
                models.Q(source_id=location_id) | models.Q(destination_id=location_id)
            )

        if doc_type:
            stock_movements = stock_movements.filter(movement_type=doc_type.upper())
        
        if status_filter:
            stock_movements = stock_movements.filter(status=status_filter.upper())

        if category_id:
            products = products.filter(category=category_id)
            stock_movements = stock_movements.filter(product__category=category_id)

        total_products = products.count()
        low_stock_count = products.filter(current_stock__lt=models.F('reorder_level')).count()
        out_of_stock_count = products.filter(current_stock=0).count()
        
        # Pending Operations
        pending_receipts = stock_movements.filter(movement_type='RECEIPT', status='DRAFT').count()
        pending_deliveries = stock_movements.filter(movement_type='DELIVERY').filter(
            models.Q(status='DRAFT') | models.Q(status='READY') | models.Q(status='PACKED')
        ).count()
        scheduled_transfers = stock_movements.filter(movement_type='TRANSFER', status='DRAFT').count()
        
        # Today's Activity
        from django.utils import timezone
        today = timezone.now().date()
        moves_today = stock_movements.filter(date__date=today).count()
        
        # Stock Health
        total_receipts = stock_movements.filter(movement_type='RECEIPT').count()
        done_receipts = stock_movements.filter(movement_type='RECEIPT', status='DONE').count()
        receipt_health = int((done_receipts / total_receipts * 100)) if total_receipts > 0 else 100
        
        total_deliveries = stock_movements.filter(movement_type='DELIVERY').count()
        done_deliveries = stock_movements.filter(movement_type='DELIVERY', status='DONE').count()
        delivery_health = int((done_deliveries / total_deliveries * 100)) if total_deliveries > 0 else 100

        # Dynamic Stock Level (Percentage of products above threshold)
        stock_level = int(((total_products - low_stock_count) / total_products * 100)) if total_products > 0 else 100

        # Activity Graph Data (Last 7 days)
        seven_days_ago = timezone.now().date() - timedelta(days=6)
        activity_query = stock_movements.filter(date__date__gte=seven_days_ago)\
            .annotate(day=TruncDate('date'))\
            .values('day')\
            .annotate(count=Count('id'))\
            .order_by('day')
        
        # Format for frontend (ensure all 7 days even if 0)
        activity_map = {item['day']: item['count'] for item in activity_query}
        activity_data = []
        for i in range(7):
            d = seven_days_ago + timedelta(days=i)
            activity_data.append({
                "date": d.strftime('%d %b'),
                "count": activity_map.get(d, 0)
            })
        
        # Categories list for filtering
        categories = list(Product.objects.values_list('category', flat=True).distinct())

        return Response({
            "total_products": total_products,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "pending_receipts": pending_receipts,
            "pending_deliveries": pending_deliveries,
            "scheduled_transfers": scheduled_transfers,
            "total_moves_today": moves_today,
            "categories": categories,
            "stock_health": {
                "receipts": receipt_health,
                "deliveries": delivery_health,
                "stock": stock_level
            },
            "activity_data": activity_data,
            "recent_moves": StockMovementSerializer(stock_movements.order_by('-date')[:5], many=True).data
        })

    def categories(self, request):
        """No longer used as an endpoint, merged into GET summary"""
        pass

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-date')
    serializer_class = StockMovementSerializer
    permission_classes = [IsAdminOrReadOnly]

    # THE MAGIC: Adding Search and Filters
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    
    # Exact Match Filters (Dropdowns on the frontend)
    filterset_fields = ['movement_type', 'status', 'product__id']
    
    # Search Bar Filters (Typing text on the frontend)
    search_fields = ['reference', 'product__name', 'product__sku']

    def _update_stock(self, movement, reverse=False):
        """Helper to apply or reverse stock math."""
        product = movement.product
        quantity = movement.quantity
        
        # Admin bypass for insufficient stock
        is_admin = self.request.user.username == 'AdminID'
        
        if movement.movement_type == 'RECEIPT':
            if reverse:
                product.current_stock -= quantity
            else:
                product.current_stock += quantity
        
        elif movement.movement_type == 'DELIVERY':
            if reverse:
                product.current_stock += quantity
            else:
                if product.current_stock < quantity and not is_admin:
                    raise ValidationError({"error": f"Insufficient stock. Only {product.current_stock} available."})
                product.current_stock -= quantity
        
        elif movement.movement_type == 'TRANSFER':
            if not reverse:
                if product.current_stock < quantity and not is_admin:
                    raise ValidationError({"error": f"Insufficient stock. Only {product.current_stock} available for transfer."})
            # NOTE: Total stock does NOT change during an internal transfer,
            # so we do not modify product.current_stock here.

        elif movement.movement_type == 'ADJUSTMENT':
            # Avoid duplicate adjustments on consecutive saves
            if movement.status == 'DONE' and not reverse:
                # User enters "Actual Quantity Found" as quantity
                target_count = quantity
                variance = target_count - product.current_stock
                
                # Update movement quantity to be the variance for the ledger
                movement.quantity = variance
                movement.save(update_fields=['quantity'])
                
                product.current_stock = target_count
            elif movement.status == 'DONE' and reverse:
                # Reverse adjustment
                product.current_stock -= movement.quantity
        
        product.save()

    def perform_create(self, serializer):
        movement_type = serializer.validated_data.get('movement_type')
        status = serializer.validated_data.get('status', 'DONE')
        quantity = serializer.validated_data.get('quantity', 0)

        # Validate transfer stock BEFORE saving, regardless of status (DRAFT or DONE)
        if movement_type == 'TRANSFER':
            if quantity <= 0:
                raise ValidationError({
                    "error": "Quantity must be greater than 0."
                })
            product = serializer.validated_data.get('product')
            if product and quantity > product.current_stock:
                raise ValidationError({
                    "error": f"Insufficient stock. Only {product.current_stock} available for transfer."
                })

        # Save first to get the object
        movement = serializer.save(user=self.request.user)
        
        # Only update stock if status is DONE or it's an ADJUSTMENT
        if status == 'DONE' or movement_type == 'ADJUSTMENT':
            try:
                with transaction.atomic():
                    self._update_stock(movement)
            except Exception as e:
                # If stock update fails (e.g. insufficient stock), delete the movement and re-raise
                movement.delete()
                raise ValidationError({"error": str(e)})

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        new_status = serializer.validated_data.get('status', old_status)
        
        # Save the update
        updated_instance = serializer.save()
        
        # Handle transitions
        if old_status == 'DRAFT' and new_status == 'DONE':
            # Apply stock update (with validation)
            try:
                self._update_stock(updated_instance)
            except Exception as e:
                # Revert status back to DRAFT if validation fails
                updated_instance.status = 'DRAFT'
                updated_instance.save(update_fields=['status'])
                raise ValidationError({"error": str(e)})
        elif old_status == 'DONE' and new_status == 'CANCELLED':
            # Reverse stock update
            self._update_stock(updated_instance, reverse=True)
        # Note: DRAFT -> CANCELLED doesn't need stock update