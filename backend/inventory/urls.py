
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'sales', views.SaleViewSet)
router.register(r'invoices', views.InvoiceViewSet)

urlpatterns = [
    path('products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('product-types/', views.ProductTypeListView.as_view(), name='product-types'),
    path('brands/', views.BrandListView.as_view(), name='brands'),
    path('materials/', views.MaterialListView.as_view(), name='materials'),

    # Inventory URLs
    path('inventory/', views.InventoryListView.as_view(), name='inventory-list'),
    path('inventory/<int:pk>/', views.InventoryDetailView.as_view(), name='inventory-detail'),
    
    # Sales and invoice URLs (using router)
    path('', include(router.urls)),
    
    # Additional sales endpoints
    path('sales/stats/', views.SaleStatsView.as_view(), name='sales-stats'),
    path('sales/quick/', views.quick_sale, name='quick-sale'),
    path('sellers/dashboard/', views.sellers_dashboard, name='sellers-dashboard'),
    path('products/available/', views.available_products, name='available-products'),
]