from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('stock_ledger.urls')),
    path('api/auth/', include('identity.urls')),        # ✅ correct
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # ✅ correct
]