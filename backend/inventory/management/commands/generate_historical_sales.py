from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import datetime, timedelta
import random
from decimal import Decimal

from inventory.models import Product, Sale, SaleItem
from customers.models import Customer


class Command(BaseCommand):
    help = 'Generate realistic historical sales data spanning multiple years'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--years',
            type=int,
            default=2,
            help='Number of years of historical data to generate (default: 2)'
        )
        parser.add_argument(
            '--sales-per-day',
            type=int,
            default=15,
            help='Average number of sales per day (default: 15)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing sales data before generating'
        )
    
    def handle(self, *args, **options):
        years = options['years']
        sales_per_day = options['sales_per_day']
        clear_existing = options['clear']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting historical sales data generation...')
        )
        self.stdout.write(f'Years: {years}')
        self.stdout.write(f'Average sales per day: {sales_per_day}')
        self.stdout.write(f'Clear existing data: {clear_existing}')
        self.stdout.write('')
        
        # Clear existing data if requested
        if clear_existing:
            self.stdout.write('Clearing existing sales data...')
            SaleItem.objects.all().delete()
            Sale.objects.all().delete()
            self.stdout.write('Existing sales data cleared.')
        
        # Get required data - only products with inventory > 0
        products = list(Product.objects.filter(inventory__quantity_in_stock__gt=0))
        if not products:
            self.stdout.write(
                self.style.ERROR('No products with available stock found. Please add inventory to products first.')
            )
            return
        
        self.stdout.write(f'Found {len(products)} products with available stock')
        
        customers = list(Customer.objects.all())
        if not customers:
            self.stdout.write(
                self.style.WARNING('No customers found. Creating default customers...')
            )
            # Create some default customers
            customers = self.create_default_customers()
        
        users = list(User.objects.all())
        if not users:
            self.stdout.write(
                self.style.ERROR('No users found. Please create at least one user.')
            )
            return
        
        # Generate historical data
        end_date = timezone.now()
        start_date = end_date - timedelta(days=years * 365)
        
        self.stdout.write(f'Generating sales from {start_date.date()} to {end_date.date()}')
        
        current_date = start_date
        total_sales = 0
        total_revenue = Decimal('0.00')
        
        while current_date < end_date:
            # Generate variable number of sales per day with realistic patterns
            daily_sales = self.get_daily_sales_count(current_date, sales_per_day)
            
            for _ in range(daily_sales):
                sale_datetime = self.get_random_time_on_date(current_date)
                
                # Create sale
                sale = self.create_realistic_sale(
                    sale_datetime, products, customers, users
                )
                
                if sale:
                    total_sales += 1
                    total_revenue += sale.final_total
                    
                    # Print progress every 100 sales
                    if total_sales % 100 == 0:
                        self.stdout.write(f'Generated {total_sales} sales...')
            
            current_date += timedelta(days=1)
        
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                f'Historical sales generation completed!'
            )
        )
        self.stdout.write(f'Total sales created: {total_sales}')
        self.stdout.write(f'Total revenue: ${total_revenue:,.2f}')
        if total_sales > 0:
            self.stdout.write(f'Average revenue per sale: ${total_revenue/total_sales:,.2f}')
        else:
            self.stdout.write('No sales were created - check for inventory or other issues')
        self.stdout.write('')
        if total_sales > 0:
            self.stdout.write(
                'Now run: python manage.py generate_sales_reports --resolution all --days {} --overwrite'.format(years * 365)
            )
    
    def create_default_customers(self):
        """Create some default customers for testing"""
        default_customers = [
            {'name_ar': 'أحمد محمد', 'name_en': 'Ahmed Mohamed', 'gender': 'male'},
            {'name_ar': 'فاطمة أحمد', 'name_en': 'Fatima Ahmed', 'gender': 'female'},
            {'name_ar': 'محمد علي', 'name_en': 'Mohamed Ali', 'gender': 'male'},
            {'name_ar': 'زهراء حسن', 'name_en': 'Zahraa Hassan', 'gender': 'female'},
            {'name_ar': 'خالد سالم', 'name_en': 'Khalid Salem', 'gender': 'male'},
            {'name_ar': 'مريم عبدالله', 'name_en': 'Mariam Abdullah', 'gender': 'female'},
            {'name_ar': 'حسين يوسف', 'name_en': 'Hussein Youssef', 'gender': 'male'},
            {'name_ar': 'ليلى إبراهيم', 'name_en': 'Layla Ibrahim', 'gender': 'female'},
        ]
        
        customers = []
        first_user = User.objects.first()
        
        for customer_data in default_customers:
            customer = Customer.objects.create(
                name_ar=customer_data['name_ar'],
                name_en=customer_data['name_en'],
                gender=customer_data['gender'],
                phone=f'05{random.randint(10000000, 99999999)}',
                created_by=first_user
            )
            customers.append(customer)
        
        return customers
    
    def get_daily_sales_count(self, date, base_count):
        """Get realistic number of sales for a given date"""
        # Weekend boost (Friday-Sunday in Lebanon)
        weekday = date.weekday()
        if weekday in [4, 5, 6]:  # Friday, Saturday, Sunday
            multiplier = 1.5
        elif weekday == 0:  # Monday
            multiplier = 1.2
        else:
            multiplier = 1.0
        
        # Seasonal patterns
        month = date.month
        if month in [11, 12, 1]:  # Winter shopping season
            seasonal_multiplier = 1.3
        elif month in [6, 7, 8]:  # Summer
            seasonal_multiplier = 1.1
        elif month == 9:  # Back to school
            seasonal_multiplier = 1.4
        else:
            seasonal_multiplier = 1.0
        
        # Add some randomness
        variance = random.uniform(0.7, 1.3)
        
        adjusted_count = int(base_count * multiplier * seasonal_multiplier * variance)
        return max(1, adjusted_count)  # At least 1 sale per day
    
    def get_random_time_on_date(self, date):
        """Get a random time during business hours on the given date"""
        # Business hours: 9 AM to 9 PM with higher probability during peak hours
        
        # Define peak hours (more likely)
        peak_hours = [12, 13, 14, 18, 19, 20]  # Lunch time and evening
        
        if random.random() < 0.6:  # 60% chance during peak hours
            hour = random.choice(peak_hours)
        else:  # 40% chance during regular business hours
            hour = random.randint(9, 21)
        
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        return date.replace(hour=hour, minute=minute, second=second)
    
    def generate_historical_sale_number(self, sale_date):
        """Generate unique sale number for historical date (mimics Sale.generate_sale_number)"""
        from inventory.models import Sale
        
        prefix = f"S{sale_date.strftime('%Y%m%d')}"
        
        # Find the last sale number for this historical date
        last_sale = Sale.objects.filter(
            sale_number__startswith=prefix
        ).order_by('sale_number').last()
        
        if last_sale:
            # Extract the sequence number and increment
            sequence = int(last_sale.sale_number[-3:]) + 1
        else:
            sequence = 1
        
        return f"{prefix}{sequence:03d}"
    
    def create_realistic_sale(self, sale_datetime, products, customers, users):
        """Create a realistic sale with items"""
        try:
            # Create sale
            sale = Sale.objects.create(
                sale_number=self.generate_historical_sale_number(sale_datetime.date()),
                sale_date=sale_datetime,
                customer=random.choice(customers) if random.random() < 0.7 else None,  # 70% have customer
                payment_method=random.choice(['cash', 'card', 'bank_transfer']),
                status='completed',
                discount_amount=Decimal(random.choice([0, 0, 0, 0, 0, 5, 10, 15, 20])),  # Most no discount
                tax_percentage=Decimal('0.00'),  # Assuming no tax for now
                created_by=random.choice(users)
            )
            
            # Add 1-5 items to the sale
            num_items = random.choices([1, 2, 3, 4, 5], weights=[40, 30, 15, 10, 5])[0]
            selected_products = random.sample(products, min(num_items, len(products)))
            
            for product in selected_products:
                quantity = random.choices([1, 2, 3, 4], weights=[70, 20, 8, 2])[0]            
                
                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    unit_price=product.selling_price
                )
            
            return sale
            
        except Exception as e:
            # Handle encoding issues with Arabic text
            error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
            self.stdout.write(
                self.style.ERROR(f'Error creating sale: {error_msg}')
            )
            return None