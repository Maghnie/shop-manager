from datetime import date, datetime, time as datetime_time
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from analytics.cache import build_cache_key, get_cache_version
from customers.models import Customer
from inventory.models import Product, ProductType, Sale, SaleItem


class AnalyticsViewsTests(APITestCase):
    maxDiff = None

    def setUp(self):
        super().setUp()
        cache.clear()
        self.user = User.objects.create_user(username='owner', password='pass', id=1)
        self.customer = Customer.objects.create(name_ar='عميل', created_by=self.user)
        self.product_type = ProductType.objects.create(name_en='Type', name_ar='نوع')
        self.product = Product.objects.create(
            type=self.product_type,
            cost_price=Decimal('10.00'),
            selling_price=Decimal('20.00'),
            created_by=self.user,
        )
        self.product.inventory.quantity_in_stock = 500
        self.product.inventory.save()
        self.sale_counter = 0

        # Seed sales history across multiple periods
        self._create_sale_item(date(2023, 1, 10), quantity=4, unit_price=Decimal('20.00'))
        self._create_sale_item(date(2023, 12, 15), quantity=5, unit_price=Decimal('20.00'))
        self._create_sale_item(date(2024, 1, 10), quantity=10, unit_price=Decimal('25.00'))
        self._create_sale_item(date(2024, 2, 1), quantity=2, unit_price=Decimal('30.00'))

    def _make_aware(self, day: date) -> datetime:
        tz = timezone.get_current_timezone()
        return timezone.make_aware(datetime.combine(day, datetime_time(hour=10)), tz)

    def _create_sale_item(self, day: date, *, quantity: int, unit_price: Decimal):
        self.sale_counter += 1
        sale = Sale.objects.create(
            sale_number=f"S-{self.sale_counter:03d}",
            sale_date=self._make_aware(day),
            customer=self.customer,
            created_by=self.user,
            status='completed',
        )
        SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=quantity,
            unit_price=unit_price,
        )

    def test_time_series_metrics_aggregations_and_changes(self):
        url = reverse('analytics:time-series-metrics')
        params = {
            'start_date': '2023-01-01',
            'end_date': '2024-02-01',
            'group_by': 'month',
        }
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, 200)

        data = response.data
        self.assertEqual(data['count'], 4)
        summary = data['summary']
        self.assertEqual(summary['totals']['revenue'], '490.00')
        self.assertEqual(summary['totals']['cost'], '210.00')
        self.assertEqual(summary['totals']['profit'], '280.00')

        periods = {item['period']: item for item in data['results']}
        january_2024_key = next(key for key in periods if key.startswith('2024-01-01'))
        february_2024_key = next(key for key in periods if key.startswith('2024-02-01'))

        january_metrics = periods[january_2024_key]
        february_metrics = periods[february_2024_key]

        self.assertEqual(january_metrics['metrics']['revenue'], '250.00')
        self.assertEqual(january_metrics['changes']['revenue']['year_over_year']['value'], '170.00')
        self.assertEqual(january_metrics['changes']['revenue']['month_over_month']['value'], '150.00')

        self.assertEqual(february_metrics['changes']['revenue']['month_over_month']['value'], '-190.00')
        self.assertEqual(february_metrics['changes']['revenue']['month_over_month']['percent'], '-76.00')
        self.assertEqual(february_metrics['metrics']['units'], 2)

    def test_time_series_validation_errors(self):
        url = reverse('analytics:time-series-metrics')

        response = self.client.get(url, {'start_date': '2024-02-01', 'end_date': '2023-01-01'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.', str(response.data))

        response = self.client.get(url, {
            'start_date': '2023-01-01',
            'end_date': '2023-02-01',
            'group_by': 'quarter',
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('قيمة التجميع غير مدعومة.', str(response.data))

    def test_time_series_cache_invalidation_on_sale_change(self):
        url = reverse('analytics:time-series-metrics')
        params = {
            'start_date': '2023-01-01',
            'end_date': '2024-02-01',
            'group_by': 'month',
        }
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, 200)
        initial_total = Decimal(response.data['summary']['totals']['revenue'])

        tz = timezone.get_current_timezone()
        start_dt = timezone.make_aware(datetime.combine(date(2023, 1, 1), datetime_time.min), tz)
        end_dt = timezone.make_aware(datetime.combine(date(2024, 2, 1), datetime_time.max), tz)
        filters = {
            'start': start_dt.isoformat(),
            'end': end_dt.isoformat(),
            'group_by': 'month',
        }
        cache_key = build_cache_key('timeseries', filters)
        self.assertIsNotNone(cache.get(cache_key))
        version_before = get_cache_version()

        # Create a new sale inside the range to invalidate the cache
        self._create_sale_item(date(2024, 1, 20), quantity=3, unit_price=Decimal('30.00'))

        version_after = get_cache_version()
        self.assertNotEqual(version_before, version_after)
        new_cache_key = build_cache_key('timeseries', filters)
        self.assertNotEqual(cache_key, new_cache_key)

        refreshed = self.client.get(url, params)
        self.assertEqual(refreshed.status_code, 200)
        updated_total = Decimal(refreshed.data['summary']['totals']['revenue'])
        self.assertEqual(updated_total, initial_total + Decimal('90.00'))

    def test_break_even_metrics_and_sorting(self):
        url = reverse('analytics:product-break-even')
        params = {
            'product_id': self.product.id,
            'extra_unit_cost': '2.00',
            'fixed_cost': '100.00',
            'ordering': '-profit',
        }
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, 200)

        data = response.data
        self.assertEqual(data['count'], 4)
        summary = data['summary']
        self.assertEqual(summary['totals']['revenue'], '490.00')
        self.assertEqual(summary['totals']['cost'], '252.00')
        self.assertEqual(summary['totals']['profit'], '238.00')
        self.assertEqual(summary['break_even']['quantity'], 9)
        self.assertEqual(summary['break_even']['variance'], 12)
        self.assertEqual(summary['break_even']['status'], 'above_break_even')
        self.assertEqual(summary['averages']['contribution_margin_ratio'], '48.57')

        first_period = data['results'][0]['period']
        self.assertTrue(first_period.startswith('2024-01-01'))

        final_record = next(item for item in data['results'] if item['period'].startswith('2024-02-01'))
        self.assertEqual(final_record['cumulative_units'], 21)
        self.assertTrue(final_record['met_break_even'])
        self.assertEqual(final_record['variance'], 12)

    def test_break_even_validation_and_cache_invalidation(self):
        url = reverse('analytics:product-break-even')
        response = self.client.get(url, {'product_id': self.product.id, 'ordering': 'invalid'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('قيمة الترتيب غير مدعومة.', str(response.data))

        params = {
            'product_id': self.product.id,
            'extra_unit_cost': '2.00',
            'fixed_cost': '100.00',
        }
        seeded = self.client.get(url, params)
        self.assertEqual(seeded.status_code, 200)
        initial_cost = Decimal(seeded.data['summary']['totals']['cost'])

        filters = {
            'product_id': self.product.id,
            'start': None,
            'end': None,
            'extra_unit_cost': '2.00',
            'fixed_cost': '100.00',
        }
        cache_key = build_cache_key('break_even', filters)
        self.assertIsNotNone(cache.get(cache_key))
        version_before = get_cache_version()

        # Update product cost to trigger cache invalidation
        self.product.cost_price = Decimal('12.00')
        self.product.save()

        version_after = get_cache_version()
        self.assertNotEqual(version_before, version_after)
        new_cache_key = build_cache_key('break_even', filters)
        self.assertNotEqual(cache_key, new_cache_key)

        refreshed = self.client.get(url, params)
        self.assertEqual(refreshed.status_code, 200)
        updated_cost = Decimal(refreshed.data['summary']['totals']['cost'])
        self.assertNotEqual(initial_cost, updated_cost)
        self.assertEqual(updated_cost, Decimal('294.00'))

        response = self.client.get(url, {})
        self.assertEqual(response.status_code, 400)
        self.assertIn('معرف المنتج مطلوب.', str(response.data))
