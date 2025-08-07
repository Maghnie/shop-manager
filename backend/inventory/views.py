

from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Max, Min
from .models import Product, ProductType, Brand, Material
from .serializers import (
    ProductSerializer, ProductTypeSerializer, 
    BrandSerializer, MaterialSerializer
)
from typing import Dict, Any, List

class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.select_related('type', 'brand', 'material')
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'brand', 'material']
    search_fields = ['type__name_ar', 'brand__name_ar', 'material__name_ar', 'tags']
    ordering_fields = ['created_at', 'cost_price', 'selling_price', 'profit_percentage']
    ordering = ['-created_at']

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related('type', 'brand', 'material')
    serializer_class = ProductSerializer

class ProductTypeListView(generics.ListAPIView):
    queryset = ProductType.objects.all()
    serializer_class = ProductTypeSerializer

class BrandListView(generics.ListAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

class MaterialListView(generics.ListAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_reports(request) -> Response:
    """Generate product reports with various metrics"""
    
    products = Product.objects.select_related('type', 'brand', 'material')
    
    if not products.exists():
        return Response({
            'message': 'No products found',
            'data': {}
        })
    
    # Calculate metrics
    profit_data = products.values(
        'id', 'type__name_ar', 'brand__name_ar', 
        'cost_price', 'selling_price'
    )
    
    # Add calculated fields
    enriched_data = []
    for product in profit_data:
        profit = product['selling_price'] - product['cost_price']
        profit_pct = (profit / product['cost_price']) * 100 if product['cost_price'] > 0 else 0
        
        enriched_data.append({
            **product,
            'profit': float(profit),
            'profit_percentage': round(profit_pct, 2)
        })
    
    # Sort by different metrics
    top_profit_usd = sorted(enriched_data, key=lambda x: x['profit'], reverse=True)[:10]
    top_profit_pct = sorted(enriched_data, key=lambda x: x['profit_percentage'], reverse=True)[:10]
    lowest_profit = sorted(enriched_data, key=lambda x: x['profit'])[:10]
    
    report_data = {
        'total_products': products.count(),
        'top_profit_usd': top_profit_usd,
        'top_profit_percentage': top_profit_pct,
        'lowest_profit': lowest_profit,
        'summary': {
            'avg_profit_usd': sum(item['profit'] for item in enriched_data) / len(enriched_data),
            'avg_profit_pct': sum(item['profit_percentage'] for item in enriched_data) / len(enriched_data),
            'max_profit_usd': max(item['profit'] for item in enriched_data),
            'min_profit_usd': min(item['profit'] for item in enriched_data),
        }
    }
    
    return Response(report_data)

