from datetime import datetime, timedelta

from django.db import models as db_models 
from django.utils import timezone

from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny

from django_filters.rest_framework import DjangoFilterBackend

# models & serializers
from .models import Product, ProductType, Brand, Material, Sale, SaleItem, Invoice, Inventory
from .serializers import (
    ProductSerializer, ProductTypeSerializer, BrandSerializer, MaterialSerializer,
    SaleSerializer, SaleListSerializer, SaleItemSerializer,
    InvoiceSerializer, InvoiceListSerializer, InventorySerializer
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
    
##################### Inventory and sales stuff 

class InventoryListView(generics.ListAPIView):
    """List all inventory items with stock levels"""
    queryset = Inventory.objects.select_related('product', 'product__type', 'product__brand').all()
    serializer_class = InventorySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # filterset_fields = ['is_low_stock', 'is_out_of_stock']
    search_fields = ['product__type__name_ar', 'product__brand__name_ar']
    ordering_fields = ['quantity_in_stock', 'last_updated']
    ordering = ['quantity_in_stock']  # Show low stock items first

class InventoryDetailView(generics.RetrieveUpdateAPIView):
    """Update inventory stock levels manually"""
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [AllowAny]

class SaleViewSet(ModelViewSet):
    """Complete CRUD operations for sales"""
    queryset = Sale.objects.prefetch_related('items__product', 'items__product__type').all()
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'created_by']
    search_fields = ['sale_number', 'customer_name', 'customer_phone']
    ordering_fields = ['sale_date', 'final_total']
    ordering = ['-sale_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SaleListSerializer
        return SaleSerializer
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark sale as completed"""
        sale = self.get_object()
        sale.status = 'completed'
        sale.save()
        
        # Create invoice if it doesn't exist
        invoice, created = Invoice.objects.get_or_create(sale=sale)
        
        return Response({
            'message': 'تم إكمال البيعة بنجاح',
            'invoice_id': invoice.id,
            'invoice_number': invoice.invoice_number
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel sale and restore inventory"""
        sale = self.get_object()
        
        if sale.status == 'cancelled':
            return Response({'error': 'البيعة ملغاة مسبقاً'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Restore inventory for all items
        for item in sale.items.all():
            item.product.inventory.quantity_in_stock += item.quantity
            item.product.inventory.save()
        
        sale.status = 'cancelled'
        sale.save()
        
        return Response({'message': 'تم إلغاء البيعة وإرجاع المخزون'})

class SaleStatsView(generics.GenericAPIView):
    """Get sales statistics and analytics"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Date filtering
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Basic stats
        total_sales = Sale.objects.filter(status='completed').count()
        total_revenue = Sale.objects.filter(status='completed').aggregate(
            total=db_models.Sum('final_total')
        )['total'] or 0
        
        total_profit = Sale.objects.filter(status='completed').aggregate(
            total=db_models.Sum('net_profit')
        )['total'] or 0
        
        # Today's stats
        today_sales = Sale.objects.filter(
            status='completed',
            sale_date__date=today
        )
        
        today_revenue = today_sales.aggregate(total=db_models.Sum('final_total'))['total'] or 0
        today_profit = today_sales.aggregate(total=db_models.Sum('net_profit'))['total'] or 0
        today_count = today_sales.count()
        
        # This week's stats
        week_sales = Sale.objects.filter(
            status='completed',
            sale_date__date__gte=week_ago
        )
        
        week_revenue = week_sales.aggregate(total=db_models.Sum('final_total'))['total'] or 0
        week_profit = week_sales.aggregate(total=db_models.Sum('net_profit'))['total'] or 0
        week_count = week_sales.count()
        
        # This month's stats
        month_sales = Sale.objects.filter(
            status='completed',
            sale_date__date__gte=month_ago
        )
        
        month_revenue = month_sales.aggregate(total=db_models.Sum('final_total'))['total'] or 0
        month_profit = month_sales.aggregate(total=db_models.Sum('net_profit'))['total'] or 0
        month_count = month_sales.count()
        
        # Top selling products
        top_products = SaleItem.objects.filter(
            sale__status='completed',
            sale__sale_date__date__gte=month_ago
        ).values(
            'product__type__name_ar',
            'product__brand__name_ar'
        ).annotate(
            total_quantity=db_models.Sum('quantity'),
            total_revenue=db_models.Sum('total_price'),
            total_profit=db_models.Sum('total_profit')
        ).order_by('-total_quantity')[:5]
        
        # Low stock alerts
        low_stock_items = Inventory.objects.filter(
            quantity_in_stock__lte=db_models.F('minimum_stock_level')
        ).count()
        
        return Response({
            'overview': {
                'total_sales': total_sales,
                'total_revenue': float(total_revenue),
                'total_profit': float(total_profit),
                'profit_margin': (float(total_profit) / float(total_revenue) * 100) if total_revenue > 0 else 0,
                'low_stock_alerts': low_stock_items,
            },
            'today': {
                'sales_count': today_count,
                'revenue': float(today_revenue),
                'profit': float(today_profit),
                'profit_margin': (float(today_profit) / float(today_revenue) * 100) if today_revenue > 0 else 0,
            },
            'this_week': {
                'sales_count': week_count,
                'revenue': float(week_revenue),
                'profit': float(week_profit),
                'profit_margin': (float(week_profit) / float(week_revenue) * 100) if week_revenue > 0 else 0,
            },
            'this_month': {
                'sales_count': month_count,
                'revenue': float(month_revenue),
                'profit': float(month_profit),
                'profit_margin': (float(month_profit) / float(month_revenue) * 100) if month_revenue > 0 else 0,
            },
            'top_products': list(top_products)
        })

class InvoiceViewSet(ModelViewSet):
    """CRUD operations for invoices"""
    queryset = Invoice.objects.select_related('sale').all()
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_printed']
    search_fields = ['invoice_number', 'sale__customer_name']
    ordering_fields = ['invoice_date']
    ordering = ['-invoice_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    @action(detail=True, methods=['post'])
    def mark_printed(self, request, pk=None):
        """Mark invoice as printed"""
        invoice = self.get_object()
        invoice.mark_as_printed()
        return Response({'message': 'تم وضع علامة الطباعة على الفاتورة'})
    
    @action(detail=True, methods=['get'])
    def print_data(self, request, pk=None):
        """Get formatted invoice data for printing"""
        invoice = self.get_object()
        serializer = InvoiceSerializer(invoice)
        
        # Format data for printing (exclude profit information)
        invoice_data = serializer.data
        sale_data = invoice_data['sale_details']
        
        # Remove profit-related fields from the response
        profit_fields = ['total_cost', 'gross_profit', 'net_profit', 'profit_percentage']
        for field in profit_fields:
            sale_data.pop(field, None)
        
        # Remove profit fields from items
        for item in sale_data['items']:
            item_profit_fields = ['profit_per_item', 'total_profit', 'profit_percentage']
            for field in item_profit_fields:
                item.pop(field, None)
        
        return Response({
            'invoice': invoice_data,
            'formatted_for_print': True,
            'print_timestamp': timezone.now()
        })

@api_view(['GET'])
def sellers_dashboard(request):
    """Dashboard view specifically for sellers showing profit information"""
    # Get date range from query params
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Default to current month if no dates provided
    if not date_from:
        date_from = timezone.now().replace(day=1).date()
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
    
    if not date_to:
        date_to = timezone.now().date()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
    
    # Filter sales by date range and completion status
    sales_queryset = Sale.objects.filter(
        status='completed',
        sale_date__date__gte=date_from,
        sale_date__date__lte=date_to
    )
    
    # Aggregate statistics
    total_sales = sales_queryset.count()
    total_revenue = sales_queryset.aggregate(db_models.Sum('final_total'))['final_total__sum'] or 0
    total_cost = sales_queryset.aggregate(db_models.Sum('total_cost'))['total_cost__sum'] or 0
    total_profit = sales_queryset.aggregate(db_models.Sum('net_profit'))['net_profit__sum'] or 0
    
    average_profit_margin = 0
    if total_cost > 0:
        average_profit_margin = (total_profit / total_cost) * 100
    
    # Sales by seller
    sellers_performance = sales_queryset.values(
        'created_by__username',
        'created_by__first_name',
        'created_by__last_name'
    ).annotate(
        sales_count=db_models.Count('id'),
        total_revenue=db_models.Sum('final_total'),
        total_profit=db_models.Sum('net_profit'),
        avg_sale_value=db_models.Avg('final_total')
    ).order_by('-total_profit')
    
    # Daily sales trend
    daily_sales = sales_queryset.extra(
        select={'sale_date_only': 'DATE(sale_date)'}
    ).values('sale_date_only').annotate(
        daily_count=db_models.Count('id'),
        daily_revenue=db_models.Sum('final_total'),
        daily_profit=db_models.Sum('net_profit')
    ).order_by('sale_date_only')
    
    # Most profitable products
    profitable_products = SaleItem.objects.filter(
        sale__status='completed',
        sale__sale_date__date__gte=date_from,
        sale__sale_date__date__lte=date_to
    ).values(
        'product__type__name_ar',
        'product__brand__name_ar',
        'product__id'
    ).annotate(
        total_quantity_sold=db_models.Sum('quantity'),
        total_revenue=db_models.Sum('total_price'),
        total_profit=db_models.Sum('total_profit'),
        avg_profit_margin=db_models.Avg('profit_percentage')
    ).order_by('-total_profit')[:10]
    
    return Response({
        'date_range': {
            'from': date_from,
            'to': date_to
        },
        'summary': {
            'total_sales': total_sales,
            'total_revenue': float(total_revenue),
            'total_cost': float(total_cost),
            'total_profit': float(total_profit),
            'profit_margin_percentage': round(average_profit_margin, 2),
            'average_sale_value': float(total_revenue / total_sales) if total_sales > 0 else 0
        },
        'sellers_performance': list(sellers_performance),
        'daily_trend': list(daily_sales),
        'top_profitable_products': list(profitable_products)
    })

@api_view(['POST'])
def quick_sale(request):
    """Create a quick sale for walk-in customers"""
    try:
        data = request.data
        
        # Validate required fields
        if not data.get('items') or len(data['items']) == 0:
            return Response(
                {'error': 'يجب إضافة منتج واحد على الأقل'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create sale data
        sale_data = {
            'customer_name': data.get('customer_name', ''),
            'payment_method': data.get('payment_method', 'cash'),
            'discount_amount': data.get('discount_amount', 0),
            'tax_percentage': data.get('tax_percentage', 0),
            'notes': data.get('notes', ''),
            'items': data['items']
        }
        
        # Create the sale
        serializer = SaleSerializer(data=sale_data, context={'request': request})
        if serializer.is_valid():
            sale = serializer.save()
            
            # Auto-create invoice
            invoice = Invoice.objects.create(sale=sale)
            
            return Response({
                'success': True,
                'sale_id': sale.id,
                'sale_number': sale.sale_number,
                'invoice_id': invoice.id,
                'invoice_number': invoice.invoice_number,
                'total': float(sale.final_total),
                'profit': float(sale.net_profit)
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response(
            {'error': f'حدث خطأ أثناء إنشاء البيعة: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
            'type_ar': product.type.name_ar,
            'brand_ar': product.brand.name_ar if product.brand else '',
            'selling_price': float(product.selling_price),
            'available_stock': product.inventory.quantity_in_stock,
            'size': product.size or '',
            'is_low_stock': product.inventory.is_low_stock
        })
    
    return Response({'products': products_data})