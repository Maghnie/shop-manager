from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Avg, Sum, Count
from .models import Product, ProductType, Brand, Material
from .serializers import ProductSerializer, ProductTypeSerializer, BrandSerializer, MaterialSerializer
from rest_framework.permissions import AllowAny

class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # FIXME just for testing because everyone can POST/PUT/GET/DELETE

class ProductTypeListView(generics.ListCreateAPIView):
    queryset = ProductType.objects.all()
    serializer_class = ProductTypeSerializer

class BrandListView(generics.ListCreateAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

class MaterialListView(generics.ListCreateAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

@api_view(['GET']) # TODO confirm not needed if reports app works
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