import calendar
import math
from datetime import datetime, time as datetime_time, timedelta
from decimal import Decimal
from typing import Dict, List, Optional

from django.core.cache import cache
from django.db.models import DateTimeField, DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncDay, TruncHour, TruncMonth, TruncWeek, TruncYear
from django.utils import timezone
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView

from inventory.models import Product, SaleItem

from .cache import build_cache_key, get_cache_timeout
from .serializers import ProductBreakEvenQuerySerializer, TimeSeriesMetricsQuerySerializer

TWOPLACES = Decimal('0.01')


def quantize_decimal(value: Optional[Decimal]) -> Optional[Decimal]:
    if value is None:
        return None
    if not isinstance(value, Decimal):
        value = Decimal(value)
    return value.quantize(TWOPLACES)


def format_decimal(value: Optional[Decimal]) -> Optional[str]:
    if value is None:
        return None
    return f"{quantize_decimal(value)}"


def make_aware_range(start_date, end_date):
    tz = timezone.get_current_timezone()
    start_dt = timezone.make_aware(datetime.combine(start_date, datetime_time.min), tz)
    end_dt = timezone.make_aware(datetime.combine(end_date, datetime_time.max), tz)
    return start_dt, end_dt


def get_trunc_expression(group_by: str):
    if group_by == 'year':
        return TruncYear('sale__sale_date', output_field=DateTimeField())
    if group_by == 'month':
        return TruncMonth('sale__sale_date', output_field=DateTimeField())
    if group_by == 'week':
        return TruncWeek('sale__sale_date', output_field=DateTimeField())
    if group_by == 'day':
        return TruncDay('sale__sale_date', output_field=DateTimeField())
    return TruncHour('sale__sale_date', output_field=DateTimeField())


def safe_replace(dt, *, year=None, month=None, day=None):
    target_year = year if year is not None else dt.year
    target_month = month if month is not None else dt.month
    if day is None:
        target_day = dt.day
    else:
        target_day = day
    last_day = calendar.monthrange(target_year, target_month)[1]
    target_day = min(target_day, last_day)
    return dt.replace(year=target_year, month=target_month, day=target_day)


def shift_period(dt, period_type: str):
    if period_type == 'year':
        return safe_replace(dt, year=dt.year - 1)
    if period_type == 'month':
        month = dt.month - 1
        year = dt.year
        if month == 0:
            month = 12
            year -= 1
        return safe_replace(dt, year=year, month=month)
    if period_type == 'week':
        return dt - timedelta(weeks=1)
    if period_type == 'day':
        return dt - timedelta(days=1)
    if period_type == 'hour':
        return dt - timedelta(hours=1)
    return None


def calculate_change(current: Optional[Decimal], previous: Optional[Decimal]):
    if current is None or previous is None:
        return {'value': None, 'percent': None}
    diff = current - previous
    percent = None
    if previous != 0:
        percent = (diff / previous) * Decimal('100')
    return {
        'value': format_decimal(diff),
        'percent': format_decimal(percent) if percent is not None else None,
    }


class AnalyticsPagination(PageNumberPagination):
    page_size = 50
    max_page_size = 500


class TimeSeriesMetricsView(APIView):
    pagination_class = AnalyticsPagination
    serializer_class = TimeSeriesMetricsQuerySerializer

    def get(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        start_dt, end_dt = make_aware_range(validated['start_date'], validated['end_date'])
        group_by = validated.get('group_by', 'month')

        paginator = self.pagination_class()
        page_size = validated.get('page_size')
        if page_size:
            paginator.page_size = page_size

        cache_filters = {
            'start': start_dt.isoformat(),
            'end': end_dt.isoformat(),
            'group_by': group_by,
        }
        cache_key = build_cache_key('timeseries', cache_filters)
        payload = cache.get(cache_key)

        if payload is None:
            payload = self._build_payload(start_dt, end_dt, group_by)
            cache.set(cache_key, payload, get_cache_timeout())
        results = payload['results']
        page = paginator.paginate_queryset(list(results), request, view=self)
        response = paginator.get_paginated_response(page)
        response.data['summary'] = payload['summary']
        return response

    def _build_payload(self, start_dt, end_dt, group_by: str):
        revenue_expr = ExpressionWrapper(
            F('quantity') * F('unit_price'),
            output_field=DecimalField(max_digits=20, decimal_places=2)
        )
        cost_expr = ExpressionWrapper(
            F('quantity') * F('product__cost_price'),
            output_field=DecimalField(max_digits=20, decimal_places=2)
        )

        queryset = (
            SaleItem.objects.filter(
                sale__status='completed',
                sale__sale_date__gte=start_dt,
                sale__sale_date__lte=end_dt,
            )
            .annotate(period=get_trunc_expression(group_by))
            .values('period')
            .annotate(
                revenue=Sum(revenue_expr),
                cost=Sum(cost_expr),
                units=Sum('quantity'),
            )
            .order_by('period')
        )

        period_map: Dict = {}
        results: List[Dict] = []
        total_revenue = Decimal('0')
        total_cost = Decimal('0')
        total_units = 0

        for entry in queryset:
            period = entry['period']
            revenue = entry['revenue'] or Decimal('0')
            cost = entry['cost'] or Decimal('0')
            units = entry['units'] or 0
            profit = revenue - cost
            total_revenue += revenue
            total_cost += cost
            total_units += units
            period_map[period] = {
                'revenue': revenue,
                'cost': cost,
                'units': units,
                'profit': profit,
            }

        for period in sorted(period_map.keys()):
            metrics = period_map[period]
            revenue = metrics['revenue']
            cost = metrics['cost']
            profit = metrics['profit']

            year_period = shift_period(period, 'year')
            month_period = shift_period(period, 'month')
            week_period = shift_period(period, 'week')
            day_period = shift_period(period, 'day')

            def get_metric(target, key):
                data = period_map.get(target)
                if not data:
                    return None
                if key == 'profit':
                    return data['profit']
                return data.get(key)

            changes = {
                'revenue': {
                    'year_over_year': calculate_change(revenue, get_metric(year_period, 'revenue')),
                    'month_over_month': calculate_change(revenue, get_metric(month_period, 'revenue')),
                    'week_over_week': calculate_change(revenue, get_metric(week_period, 'revenue')),
                    'day_over_day': calculate_change(revenue, get_metric(day_period, 'revenue')),
                },
                'cost': {
                    'year_over_year': calculate_change(cost, get_metric(year_period, 'cost')),
                    'month_over_month': calculate_change(cost, get_metric(month_period, 'cost')),
                    'week_over_week': calculate_change(cost, get_metric(week_period, 'cost')),
                    'day_over_day': calculate_change(cost, get_metric(day_period, 'cost')),
                },
                'profit': {
                    'year_over_year': calculate_change(profit, get_metric(year_period, 'profit')),
                    'month_over_month': calculate_change(profit, get_metric(month_period, 'profit')),
                    'week_over_week': calculate_change(profit, get_metric(week_period, 'profit')),
                    'day_over_day': calculate_change(profit, get_metric(day_period, 'profit')),
                },
            }

            results.append({
                'period': timezone.localtime(period).isoformat(),
                'metrics': {
                    'revenue': format_decimal(revenue),
                    'cost': format_decimal(cost),
                    'profit': format_decimal(profit),
                    'units': metrics['units'],
                },
                'changes': changes,
            })

        payload = {
            'results': results,
            'summary': {
                'group_by': group_by,
                'range': {
                    'start': start_dt.isoformat(),
                    'end': end_dt.isoformat(),
                },
                'totals': {
                    'revenue': format_decimal(total_revenue),
                    'cost': format_decimal(total_cost),
                    'profit': format_decimal(total_revenue - total_cost),
                    'units': total_units,
                },
                'latest_period': results[-1]['period'] if results else None,
                'latest_changes': results[-1]['changes'] if results else {},
            },
        }
        return payload


class ProductBreakEvenView(APIView):
    pagination_class = AnalyticsPagination
    serializer_class = ProductBreakEvenQuerySerializer

    def get(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        product = self._get_product(validated['product_id'])
        start_date = validated.get('start_date')
        end_date = validated.get('end_date')
        if start_date and end_date:
            start_dt, end_dt = make_aware_range(start_date, end_date)
        elif start_date:
            start_dt, end_dt = make_aware_range(start_date, start_date)
        elif end_date:
            start_dt, end_dt = make_aware_range(end_date, end_date)
        else:
            start_dt = end_dt = None

        paginator = self.pagination_class()
        page_size = validated.get('page_size')
        if page_size:
            paginator.page_size = page_size

        cache_filters = {
            'product_id': product.id,
            'start': start_dt.isoformat() if start_dt else None,
            'end': end_dt.isoformat() if end_dt else None,
            'extra_unit_cost': str(validated.get('extra_unit_cost', Decimal('0'))),
            'fixed_cost': str(validated.get('fixed_cost', Decimal('0'))),
        }
        cache_key = build_cache_key('break_even', cache_filters)
        from django.core.cache import cache
        payload = cache.get(cache_key)
        if payload is None:
            payload = self._build_payload(product, start_dt, end_dt, validated)
            cache.set(cache_key, payload, get_cache_timeout())

        records = payload['results']
        ordering = validated.get('ordering', '-profit')
        records = self._sort_records(records, ordering)

        page = paginator.paginate_queryset(records, request, view=self)
        response = paginator.get_paginated_response(page)
        response.data['summary'] = payload['summary']
        return response

    def _get_product(self, product_id: int) -> Product:
        try:
            return Product.objects.get(pk=product_id)
        except Product.DoesNotExist as exc:
            raise NotFound('المنتج المطلوب غير موجود.') from exc

    def _build_payload(self, product: Product, start_dt, end_dt, validated):
        extra_unit_cost = validated.get('extra_unit_cost', Decimal('0'))
        fixed_cost = validated.get('fixed_cost', Decimal('0'))

        queryset = SaleItem.objects.filter(product=product, sale__status='completed')
        if start_dt:
            queryset = queryset.filter(sale__sale_date__gte=start_dt)
        if end_dt:
            queryset = queryset.filter(sale__sale_date__lte=end_dt)

        revenue_expr = ExpressionWrapper(
            F('quantity') * F('unit_price'),
            output_field=DecimalField(max_digits=20, decimal_places=2)
        )
        cost_expr = ExpressionWrapper(
            F('quantity') * F('product__cost_price'),
            output_field=DecimalField(max_digits=20, decimal_places=2)
        )

        aggregates = queryset.aggregate(
            total_units=Sum('quantity'),
            total_revenue=Sum(revenue_expr),
            base_cost=Sum(cost_expr),
        )
        total_units = aggregates['total_units'] or 0
        total_revenue = aggregates['total_revenue'] or Decimal('0')
        base_cost = aggregates['base_cost'] or Decimal('0')
        extra_cost_total = Decimal(extra_unit_cost) * Decimal(total_units)
        total_cost = base_cost + extra_cost_total
        profit = total_revenue - total_cost

        if total_units > 0:
            average_price = total_revenue / Decimal(total_units)
            variable_cost_per_unit = total_cost / Decimal(total_units)
        else:
            average_price = product.selling_price
            variable_cost_per_unit = product.cost_price + Decimal(extra_unit_cost)

        contribution_margin_per_unit = average_price - variable_cost_per_unit
        contribution_margin_ratio = (
            (contribution_margin_per_unit / average_price) * Decimal('100')
            if average_price else Decimal('0')
        )

        break_even_quantity = None
        break_even_revenue = None
        status = 'no_margin'
        variance = None
        if contribution_margin_per_unit > 0:
            break_even_quantity = 0
            if fixed_cost > 0:
                break_even_quantity = math.ceil(fixed_cost / contribution_margin_per_unit)
            break_even_revenue = (Decimal(break_even_quantity) * average_price) if break_even_quantity is not None else None
            variance = total_units - break_even_quantity
            status = 'above_break_even' if variance >= 0 else 'below_break_even'

        summary = {
            'product': {
                'id': product.id,
                'name': str(product),
                'cost_price': format_decimal(product.cost_price),
                'selling_price': format_decimal(product.selling_price),
            },
            'filters': {
                'start': start_dt.isoformat() if start_dt else None,
                'end': end_dt.isoformat() if end_dt else None,
                'extra_unit_cost': format_decimal(extra_unit_cost),
                'fixed_cost': format_decimal(fixed_cost),
            },
            'totals': {
                'revenue': format_decimal(total_revenue),
                'cost': format_decimal(total_cost),
                'profit': format_decimal(profit),
                'units': total_units,
            },
            'averages': {
                'average_price': format_decimal(average_price),
                'variable_cost_per_unit': format_decimal(variable_cost_per_unit),
                'contribution_margin_per_unit': format_decimal(contribution_margin_per_unit),
                'contribution_margin_ratio': format_decimal(contribution_margin_ratio),
            },
            'break_even': {
                'quantity': break_even_quantity,
                'revenue': format_decimal(break_even_revenue),
                'fixed_cost': format_decimal(fixed_cost),
                'status': status,
                'variance': variance,
                'actual_units': total_units,
            },
        }

        period_queryset = (
            queryset.annotate(period=TruncMonth('sale__sale_date', output_field=DateTimeField()))
            .values('period')
            .annotate(
                units=Sum('quantity'),
                revenue=Sum(revenue_expr),
                base_cost=Sum(cost_expr),
            )
            .order_by('period')
        )

        cumulative_units = 0
        records = []
        for entry in period_queryset:
            period = entry['period']
            units = entry['units'] or 0
            revenue = entry['revenue'] or Decimal('0')
            base = entry['base_cost'] or Decimal('0')
            extra = Decimal(extra_unit_cost) * Decimal(units)
            cost = base + extra
            period_profit = revenue - cost
            cumulative_units += units
            avg_price_period = revenue / Decimal(units) if units else Decimal('0')
            variable_cost_period = cost / Decimal(units) if units else Decimal('0')
            margin_per_unit_period = avg_price_period - variable_cost_period if units else Decimal('0')
            margin_ratio_period = (
                (margin_per_unit_period / avg_price_period) * Decimal('100')
                if units and avg_price_period
                else None
            )
            variance_period = None
            met_break_even = False
            if break_even_quantity is not None:
                variance_period = cumulative_units - break_even_quantity
                met_break_even = variance_period >= 0

            records.append({
                'period': timezone.localtime(period),
                'units': units,
                'revenue': revenue,
                'cost': cost,
                'profit': period_profit,
                'average_price': avg_price_period,
                'margin_per_unit': margin_per_unit_period,
                'margin_ratio': margin_ratio_period,
                'cumulative_units': cumulative_units,
                'break_even_quantity': break_even_quantity,
                'variance': variance_period,
                'met_break_even': met_break_even,
            })

        payload = {
            'results': [
                {
                    'period': item['period'].date().isoformat(),
                    'units': item['units'],
                    'revenue': format_decimal(item['revenue']),
                    'cost': format_decimal(item['cost']),
                    'profit': format_decimal(item['profit']),
                    'average_price': format_decimal(item['average_price']),
                    'margin_per_unit': format_decimal(item['margin_per_unit']),
                    'margin_ratio': format_decimal(item['margin_ratio']) if item['margin_ratio'] is not None else None,
                    'cumulative_units': item['cumulative_units'],
                    'break_even_quantity': item['break_even_quantity'],
                    'variance': item['variance'],
                    'met_break_even': item['met_break_even'],
                }
                for item in records
            ],
            'summary': summary,
        }
        return payload

    def _sort_records(self, records: List[Dict], ordering: str):
        if not records:
            return records
        reverse = ordering.startswith('-')
        field = ordering.lstrip('-') or 'profit'
        if field not in {'period', 'revenue', 'cost', 'profit', 'units', 'variance', 'margin_ratio'}:
            return records

        def key(record):
            if field == 'period':
                return record['period']
            value = record.get(field)
            if value is None:
                return Decimal('-999999999') if reverse else Decimal('999999999')
            try:
                return Decimal(value)
            except Exception:
                return value

        return sorted(records, key=key, reverse=reverse)
