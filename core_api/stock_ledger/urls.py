from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, LocationViewSet, ProductViewSet, StockMovementViewSet, DashboardSummaryView

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'products', ProductViewSet)
router.register(r'movements', StockMovementViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]