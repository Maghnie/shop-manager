from .models import SalesReport
from decimal import Decimal


class IncrementalReportService:
    def update_reports_for_sale(self, sale):
        """Update only the affected time periods for a specific sale"""
        sale_date = sale.sale_date

        # Define periods to update
        periods_to_update = [
            ('hourly', sale_date.replace(minute=0, second=0, microsecond=0)),
            ('daily', sale_date.replace(hour=0, minute=0, second=0, microsecond=0)),
            ('weekly', self._get_week_start(sale_date)),
            ('monthly', sale_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)),
            ('yearly', sale_date.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0))
        ]

        for resolution, period_start in periods_to_update:
            self._update_single_period(resolution, period_start, sale)

    def _update_single_period(self, resolution, period_start, sale):
        # Get or create the report for this period
        period_end = self._calculate_period_end(resolution, period_start)

        report, created = SalesReport.objects.get_or_create(
            resolution=resolution,
            period_start=period_start,
            defaults={
                'period_end': period_end,
                'sales_count': 0,
                'total_revenue': Decimal('0.00'),
                'total_cost': Decimal('0.00')
            }
        )

        # Increment the values
        report.sales_count += 1
        report.total_revenue += sale.final_total
        report.total_cost += sale.total_cost
        report.save()