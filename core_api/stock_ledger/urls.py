from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, LocationViewSet, ProductViewSet, StockMovementViewSet

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'products', ProductViewSet)
router.register(r'movements', StockMovementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]