# views.py — replace imports with:
from datetime import datetime, timedelta
from decimal import Decimal

from django.db import models, transaction
from django.db.models import (
    Sum, F, DecimalField, ExpressionWrapper, Value, Count, Avg
)
from django.db.models.functions import TruncDate, Coalesce
from django.utils import timezone

from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny

import django_filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Product, ProductType, Brand, Material,
    Sale, SaleItem, Invoice, Inventory
)
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
    """Get sales statistics and analytics (all DB-side, efficient)."""
    permission_classes = [AllowAny]

    # helper to compute aggregates for a Sale queryset
    def _compute_sales_aggregates(self, sales_qs):
        """
        Given a queryset of Sale objects (already filtered, e.g. by date and status),
        returns (total_revenue_decimal, total_cost_decimal, total_sales_count)
        where:
            total_revenue = SUM( subtotal - discount + tax )
            subtotal per sale = SUM(items.quantity * items.unit_price)
            total_cost     = SUM(items.quantity * product.cost_price)
        Uses Coalesce to avoid NULLs.
        """
        # Subtotal per sale (sum of item quantity * unit_price)
        subtotal_per_sale = Sum(
            F('items__quantity') * F('items__unit_price'),
            output_field=DecimalField(max_digits=18, decimal_places=2)
        )

        # Total cost per sale (sum of item quantity * product.cost_price)
        cost_per_sale = Sum(
            F('items__quantity') * F('items__product__cost_price'),
            output_field=DecimalField(max_digits=18, decimal_places=2)
        )

        # Annotate each sale with its subtotal and cost (these are per-sale aggregates)
        sales_with_annots = sales_qs.annotate(
            subtotal=Coalesce(subtotal_per_sale, Value(0), output_field=DecimalField(max_digits=18, decimal_places=2)),
            total_cost_per_sale=Coalesce(cost_per_sale, Value(0), output_field=DecimalField(max_digits=18, decimal_places=2))
        )

        # revenue expression per sale: subtotal - discount + tax_amount
        # where tax_amount = (subtotal - discount) * tax_percentage / 100
        revenue_expr_per_sale = ExpressionWrapper(
            F('subtotal') - F('discount_amount') +
            ((F('subtotal') - F('discount_amount')) * F('tax_percentage') / Value(100)),
            output_field=DecimalField(max_digits=18, decimal_places=2)
        )

        # Aggregate over all annotated sales
        agg = sales_with_annots.aggregate(
            total_revenue=Coalesce(Sum(revenue_expr_per_sale), Value(0), output_field=DecimalField(max_digits=18, decimal_places=2)),
            total_cost=Coalesce(Sum('total_cost_per_sale'), Value(0), output_field=DecimalField(max_digits=18, decimal_places=2)),
            total_sales=Coalesce(Count('id'), Value(0))
        )

        return agg['total_revenue'], agg['total_cost'], agg['total_sales']

    def get(self, request):
        # Date filtering
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # Base queryset: completed sales
        completed_qs = Sale.objects.filter(status='completed')

        # --- OVERALL (all-time completed)
        total_sales = completed_qs.count()
        total_revenue_dec, total_cost_dec, _ = self._compute_sales_aggregates(completed_qs)
        total_profit_dec = (total_revenue_dec or 0) - (total_cost_dec or 0)

        # --- TODAY
        today_qs = completed_qs.filter(sale_date__date=today)
        today_revenue_dec, today_cost_dec, today_count = self._compute_sales_aggregates(today_qs)
        today_profit_dec = (today_revenue_dec or 0) - (today_cost_dec or 0)

        # --- THIS WEEK
        week_qs = completed_qs.filter(sale_date__date__gte=week_ago)
        week_revenue_dec, week_cost_dec, week_count = self._compute_sales_aggregates(week_qs)
        week_profit_dec = (week_revenue_dec or 0) - (week_cost_dec or 0)

        # --- THIS MONTH
        month_qs = completed_qs.filter(sale_date__date__gte=month_ago)
        month_revenue_dec, month_cost_dec, month_count = self._compute_sales_aggregates(month_qs)
        month_profit_dec = (month_revenue_dec or 0) - (month_cost_dec or 0)

        # --- TOP SELLING PRODUCTS (last 30 days)
        # Note: SaleItem.total_price and .total_profit are @property — compute via expressions
        top_products_qs = (
            SaleItem.objects
            .filter(sale__status='completed', sale__sale_date__date__gte=month_ago)
            .values(
                'product__id',
                'product__type__name_ar',
                'product__brand__name_ar',
                'product__type',     # optional ids if you want to link
                'product__brand'
            )
            .annotate(
                total_quantity=Coalesce(Sum('quantity'), Value(0)),
                total_revenue=Coalesce(
                    Sum(
                        ExpressionWrapper(
                            F('quantity') * F('unit_price'),
                            output_field=DecimalField(max_digits=18, decimal_places=2)
                        )
                    ),
                    Value(0),
                    output_field=DecimalField(max_digits=18, decimal_places=2)
                ),
                total_profit=Coalesce(
                    Sum(
                        ExpressionWrapper(
                            F('quantity') * (F('unit_price') - F('product__cost_price')),
                            output_field=DecimalField(max_digits=18, decimal_places=2)
                        )
                    ),
                    Value(0),
                    output_field=DecimalField(max_digits=18, decimal_places=2)
                )
            )
            .order_by('-total_quantity')[:5]
        )

        # Convert top_products queryset to clean list with numeric types
        top_products = []
        for p in top_products_qs:
            tr = p.get('total_revenue') or 0
            tp = p.get('total_profit') or 0
            top_products.append({
                'product_id': p.get('product__id'),
                'type_name_ar': p.get('product__type__name_ar'),
                'brand_name_ar': p.get('product__brand__name_ar'),
                'total_quantity': int(p.get('total_quantity') or 0),
                'total_revenue': float(tr),
                'total_profit': float(tp),
            })

        # --- LOW STOCK
        low_stock_items = Inventory.objects.filter(quantity_in_stock__lte=F('minimum_stock_level')).count()

        # Build response (floats as you requested in the original)
        def pct(profit, revenue):
            try:
                return round((float(profit) / float(revenue) * 100), 2) if revenue and float(revenue) != 0 else 0
            except Exception:
                return 0

        return Response({
            'overview': {
                'total_sales': int(total_sales),
                'total_revenue': float(total_revenue_dec or 0),
                'total_profit': float(total_profit_dec or 0),
                'profit_margin': pct(total_profit_dec, total_revenue_dec),
                'low_stock_alerts': int(low_stock_items),
            },
            'today': {
                'sales_count': int(today_count),
                'revenue': float(today_revenue_dec or 0),
                'profit': float(today_profit_dec or 0),
                'profit_margin': pct(today_profit_dec, today_revenue_dec),
            },
            'this_week': {
                'sales_count': int(week_count),
                'revenue': float(week_revenue_dec or 0),
                'profit': float(week_profit_dec or 0),
                'profit_margin': pct(week_profit_dec, week_revenue_dec),
            },
            'this_month': {
                'sales_count': int(month_count),
                'revenue': float(month_revenue_dec or 0),
                'profit': float(month_profit_dec or 0),
                'profit_margin': pct(month_profit_dec, month_revenue_dec),
            },
            'top_products': top_products
        }, status=status.HTTP_200_OK)

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
    total_revenue = sales_queryset.aggregate(Sum('final_total'))['final_total__sum'] or 0
    total_cost = sales_queryset.aggregate(Sum('total_cost'))['total_cost__sum'] or 0
    total_profit = sales_queryset.aggregate(Sum('net_profit'))['net_profit__sum'] or 0
    
    average_profit_margin = 0
    if total_cost > 0:
        average_profit_margin = (total_profit / total_cost) * 100
    
    # Sales by seller
    sellers_performance = sales_queryset.values(
        'created_by__username',
        'created_by__first_name',
        'created_by__last_name'
    ).annotate(
        sales_count=Count('id'),
        total_revenue=Sum('final_total'),
        total_profit=Sum('net_profit'),
        avg_sale_value=Avg('final_total')
    ).order_by('-total_profit')
    
    # Daily sales trend
    daily_sales = sales_queryset.extra(
        select={'sale_date_only': 'DATE(sale_date)'}
    ).values('sale_date_only').annotate(
        daily_count=Count('id'),
        daily_revenue=Sum('final_total'),
        daily_profit=Sum('net_profit')
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
        total_quantity_sold=Sum('quantity'),
        total_revenue=Sum('total_price'),
        total_profit=Sum('total_profit'),
        avg_profit_margin=Avg('profit_percentage')
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