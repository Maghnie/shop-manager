from datetime import datetime, timedelta
from decimal import Decimal

from django.db import models, transaction
from django.db.models import (
    Sum, F, DecimalField, ExpressionWrapper, Value, Count, Avg
)
from django.db.models.functions import TruncDate, Coalesce
from django.utils import timezone

from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.cache import cache_page
from django.core.cache import cache
import django_filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Sale, SaleItem, Invoice
from .serializers import (
    SaleSerializer, SaleListSerializer, SaleItemSerializer,
    InvoiceSerializer, InvoiceListSerializer
)


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
        from inventory.models import Inventory
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
