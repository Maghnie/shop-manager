
from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('product-types/', views.ProductTypeListView.as_view(), name='product-types'),
    path('brands/', views.BrandListView.as_view(), name='brands'),
    path('materials/', views.MaterialListView.as_view(), name='materials'),

    # Inventory URLs
    path('inventory/', views.InventoryListView.as_view(), name='inventory-list'),
    path('inventory/<int:pk>/', views.InventoryDetailView.as_view(), name='inventory-detail'),
    
    path('products/<int:pk>/toggle-archive/', views.ToggleProductArchiveView.as_view(), name='toggle-product-archive'),

    # Products with stock for sales
    path('products/available/', views.available_products, name='available-products'),
    path('reports/', views.product_reports, name='product-reports'),
]