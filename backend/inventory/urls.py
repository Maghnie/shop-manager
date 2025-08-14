
from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('product-types/', views.ProductTypeListView.as_view(), name='product-types'),
    path('brands/', views.BrandListView.as_view(), name='brands'),
    path('materials/', views.MaterialListView.as_view(), name='materials'),
]