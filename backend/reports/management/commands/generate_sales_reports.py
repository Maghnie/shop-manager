from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum, Count
from datetime import datetime, timedelta
from decimal import Decimal
import pytz

from inventory.models import Sale
from reports.models import SalesReport


class Command(BaseCommand):
    help = 'Generate sales reports for different time resolutions'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--resolution',
            type=str,
            choices=['hourly', 'daily', 'weekly', 'monthly', 'yearly', 'all'],
            default='all',
            help='Time resolution for the report (default: all)'
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to look back (default: 30)'
        )
        parser.add_argument(
            '--overwrite',
            action='store_true',
            help='Overwrite existing reports'
        )
    
    def handle(self, *args, **options):
        resolution = options['resolution']
        days_back = options['days']
        overwrite = options['overwrite']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting sales report generation...')
        )
        self.stdout.write(f'Resolution: {resolution}')
        self.stdout.write(f'Days back: {days_back}')
        self.stdout.write(f'Overwrite existing: {overwrite}')
        self.stdout.write('')
        
        # Define which resolutions to process
        if resolution == 'all':
            resolutions = ['hourly', 'daily', 'weekly', 'monthly', 'yearly']
        else:
            resolutions = [resolution]
        
        total_created = 0
        total_updated = 0
        
        for res in resolutions:
            created, updated = self.generate_reports_for_resolution(res, days_back, overwrite)
            total_created += created
            total_updated += updated
        
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                f'Report generation completed! '
                f'Created: {total_created}, Updated: {total_updated}'
            )
        )
    
    def generate_reports_for_resolution(self, resolution, days_back, overwrite):
        """Generate reports for a specific resolution"""
        self.stdout.write(f'Processing {resolution} reports...')
        
        # Get the timezone from settings
        tz = timezone.get_current_timezone()
        now = timezone.now()
        start_date = now - timedelta(days=days_back)
        
        # Get all completed sales in the date range
        sales = Sale.objects.filter(
            status='completed',
            sale_date__gte=start_date,
            sale_date__lte=now
        ).order_by('sale_date')
        
        if not sales.exists():
            self.stdout.write(
                self.style.WARNING(f'No sales found in the last {days_back} days')
            )
            return 0, 0
        
        # Generate time periods based on resolution
        periods = self.generate_time_periods(resolution, start_date, now, tz)
        
        created_count = 0
        updated_count = 0
        
        for period_start, period_end in periods:
            # Get sales for this period
            period_sales = sales.filter(
                sale_date__gte=period_start,
                sale_date__lt=period_end
            )
            
            if not period_sales.exists():
                continue
                
            # Calculate aggregated metrics
            sales_count = period_sales.count()
            
            # Calculate revenue and cost
            total_revenue = Decimal('0.00')
            total_cost = Decimal('0.00')
            
            for sale in period_sales:
                total_revenue += sale.final_total
                # Calculate cost from sale items
                for item in sale.items.all():
                    total_cost += item.product.cost_price * item.quantity
            
            # Check if report already exists
            existing_report = SalesReport.objects.filter(
                resolution=resolution,
                period_start=period_start
            ).first()
            
            if existing_report and not overwrite:
                continue
                
            # Create or update the report
            report_data = {
                'resolution': resolution,
                'period_start': period_start,
                'period_end': period_end,
                'sales_count': sales_count,
                'total_revenue': total_revenue,
                'total_cost': total_cost,
            }
            
            if existing_report:
                for key, value in report_data.items():
                    setattr(existing_report, key, value)
                existing_report.save()
                updated_count += 1
                self.stdout.write(f'  Updated: {existing_report.period_display}')
            else:
                report = SalesReport.objects.create(**report_data)
                created_count += 1
                self.stdout.write(f'  Created: {report.period_display}')
        
        self.stdout.write(
            f'  {resolution.title()}: {created_count} created, {updated_count} updated'
        )
        return created_count, updated_count
    
    def generate_time_periods(self, resolution, start_date, end_date, tz):
        """Generate time periods based on resolution"""
        periods = []
        
        if resolution == 'hourly':
            current = start_date.replace(minute=0, second=0, microsecond=0)
            while current < end_date:
                period_end = current + timedelta(hours=1)
                periods.append((current, period_end))
                current = period_end
                
        elif resolution == 'daily':
            current = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            while current < end_date:
                period_end = current + timedelta(days=1)
                periods.append((current, period_end))
                current = period_end
                
        elif resolution == 'weekly':
            # Start from Monday of the week
            days_since_monday = start_date.weekday()
            current = (start_date - timedelta(days=days_since_monday)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            while current < end_date:
                period_end = current + timedelta(weeks=1)
                periods.append((current, period_end))
                current = period_end
                
        elif resolution == 'monthly':
            current = start_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            while current < end_date:
                # Calculate next month
                if current.month == 12:
                    next_month = current.replace(year=current.year + 1, month=1)
                else:
                    next_month = current.replace(month=current.month + 1)
                periods.append((current, next_month))
                current = next_month
                
        elif resolution == 'yearly':
            current = start_date.replace(
                month=1, day=1, hour=0, minute=0, second=0, microsecond=0
            )
            while current < end_date:
                next_year = current.replace(year=current.year + 1)
                periods.append((current, next_year))
                current = next_year
        
        return periods