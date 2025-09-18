from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, action
from rest_framework.views import APIView
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
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # FIXME just for testing because everyone can POST/PUT/GET/DELETE

    def get_queryset(self):
        """Filter active products by default, unless archived=true"""
        queryset = Product.objects.all()
        archived = self.request.query_params.get('archived', 'false').lower()
        
        if archived == 'true':
            return queryset.filter(is_active=False)
        else:
            return queryset.filter(is_active=True)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # FIXME just for testing because everyone can POST/PUT/GET/DELETE

    def destroy(self, request, *args, **kwargs):
        """Archive product instead of deleting it"""
        instance = self.get_object()

        # Don't actually delete, just archive
        instance.is_active = False
        instance.save()
        return Response({
            'status': 'archived',
            'message': 'تم أرشفة المنتج بنجاح'
        }, status=status.HTTP_200_OK)

class ProductTypeListView(generics.ListCreateAPIView):
    queryset = ProductType.objects.all()
    serializer_class = ProductTypeSerializer
    permission_classes = [AllowAny]  # FIXME just for testing because everyone can POST/PUT/GET/DELETE

class ToggleProductArchiveView(APIView):
    """Toggle product archive status"""
    permission_classes = [AllowAny] # FIXME 
    
    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            product.is_active = not product.is_active
            product.save()
            
            action = "تم إلغاء الأرشفة" if product.is_active else "تم الأرشفة"
            
            return Response({
                'status': 'success',
                'is_active': product.is_active,
                'message': f'{action} للمنتج بنجاح'
            })
        except Product.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'المنتج غير موجود'
            }, status=status.HTTP_404_NOT_FOUND)
        
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
    include_archived = django_filters.BooleanFilter(method='filter_archived') 
    
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
    
    def filter_archived(self, queryset, name, value):
        """Filter to show/hide archived products"""
        if value is True:
            return queryset.filter(product__is_active=False)  # Only archived
        elif value is False:
            return queryset.filter(product__is_active=True)   # Only active
        return queryset  # Show all if not specified

class InventoryListView(generics.ListAPIView):
    """List all inventory items with stock levels"""
    # queryset = Inventory.objects.select_related('product', 'product__type', 'product__brand').all()
    serializer_class = InventorySerializer
    permission_classes = [AllowAny] # FIXME
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = InventoryFilter
    search_fields = ['product__type__name_ar', 'product__brand__name_ar']
    ordering_fields = ['quantity_in_stock', 'last_updated']
    ordering = ['quantity_in_stock']  # Show low stock items first

    def get_queryset(self):
        """Filter inventory for active products, with option to include archived"""
        base_queryset = Inventory.objects.select_related('product', 'product__type', 'product__brand')
        
        # Check if we want to include archived products
        include_archived = self.request.query_params.get('include_archived', 'false').lower() == 'true'
        
        if include_archived:
            # Show all inventory (active + archived products)
            return base_queryset.all()
        else:
            # Default: only show inventory for active products
            return base_queryset.filter(product__is_active=True)

class InventoryDetailView(generics.RetrieveUpdateAPIView):
    """Update inventory stock levels manually"""
    # queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [AllowAny] # FIXME

    def get_queryset(self):
        """Allow updating inventory for both active and archived products"""
        # For detail view, allow access to both active and archived
        # since users might need to adjust stock for archived items
        return Inventory.objects.select_related('product').all()


@api_view(['GET'])
def available_products(request):
    """Get products with available stock for sales"""
    products_with_stock = Product.objects.filter(
        is_active=True, # i.e. product not archived by end user
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