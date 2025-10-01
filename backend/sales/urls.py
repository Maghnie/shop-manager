from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'sales', views.SaleViewSet)
router.register(r'invoices', views.InvoiceViewSet)

urlpatterns = [
    # Sales stats
    path('sales/stats/', views.SaleStatsView.as_view(), name='sales-stats'),

    # Router URLs
    path('', include(router.urls)),
]