from rest_framework import generics, status, filters
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F

from .models import (
    Product, ProductType, Brand, Material, Inventory
)
from .serializers import (
    ProductSerializer, ProductTypeSerializer, BrandSerializer, MaterialSerializer,
    InventorySerializer
)


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # FIXME just for testing because everyone can POST/PUT/GET/DELETE

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # FIXME just for testing because everyone can POST/PUT/GET/DELETE

class ProductTypeListView(generics.ListCreateAPIView):
    queryset = ProductType.objects.all()
    serializer_class = ProductTypeSerializer
    permission_classes = [AllowAny]  # FIXME just for testing because everyone can POST/PUT/GET/DELETE

class BrandListView(generics.ListCreateAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

class MaterialListView(generics.ListCreateAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

@api_view(['GET'])
def product_reports(request):
    try:
        total_products = Product.objects.count()
        return Response({
            'summary': {
                'total_products': total_products,
            }
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 

class InventoryFilter(django_filters.FilterSet):
    is_low_stock = django_filters.BooleanFilter(method='filter_low_stock')
    is_out_of_stock = django_filters.BooleanFilter(method='filter_out_of_stock')
    
    class Meta:
        model = Inventory
        fields = ['product__type', 'product__brand']  # Only real DB fields
    
    def filter_low_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(quantity_in_stock__lte=F('minimum_stock_level'))
        elif value is False:
            return queryset.filter(quantity_in_stock__gt=F('minimum_stock_level'))
        return queryset
    
    def filter_out_of_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(quantity_in_stock=0)
        elif value is False:
            return queryset.filter(quantity_in_stock__gt=0)
        return queryset

class InventoryListView(generics.ListAPIView):
    """List all inventory items with stock levels"""
    queryset = Inventory.objects.select_related('product', 'product__type', 'product__brand').all()
    serializer_class = InventorySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = InventoryFilter
    search_fields = ['product__type__name_ar', 'product__brand__name_ar']
    ordering_fields = ['quantity_in_stock', 'last_updated']
    ordering = ['quantity_in_stock']  # Show low stock items first

class InventoryDetailView(generics.RetrieveUpdateAPIView):
    """Update inventory stock levels manually"""
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [AllowAny]


@api_view(['GET'])
def available_products(request):
    """Get products with available stock for sales"""
    products_with_stock = Product.objects.filter(
        inventory__quantity_in_stock__gt=0
    ).select_related('type', 'brand', 'inventory').order_by('type__name_ar')

    products_data = []
    for product in products_with_stock:
        products_data.append({
            'id': product.id,
            'name': str(product),
            'type_name_ar': product.type.name_ar,
            'brand_name_ar': product.brand.name_ar if product.brand else 'عام',
            'cost_price': float(product.cost_price),
            'selling_price': float(product.selling_price),
            'available_stock': product.inventory.quantity_in_stock,
            'size': product.size or '',
            'is_low_stock': product.inventory.is_low_stock
        })

    return Response({'products': products_data})