from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from customers.models import Customer


class Command(BaseCommand):
    help = 'Create default placeholder customers (فلان and فلانة)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing placeholder customers and recreate them',
        )

    def handle(self, *args, **options):
        """Create default customers"""
        
        # Get or create admin user
        admin_user = self.get_or_create_admin_user()
        
        if options['reset']:
            self.stdout.write(
                self.style.WARNING('Deleting existing placeholder customers...')
            )
            Customer.objects.filter(is_placeholder=True).delete()

        # Create default male customer
        male_customer, male_created = Customer.objects.get_or_create(
            name_ar="فلان",
            is_placeholder=True,
            defaults={
                'name_en': 'John Doe',
                'gender': 'male',
                'created_by': admin_user,
                'notes': 'عميل افتراضي للذكور - يُستخدم عندما لا يُعرف اسم العميل'
            }
        )

        # Create default female customer  
        female_customer, female_created = Customer.objects.get_or_create(
            name_ar="فلانة", 
            is_placeholder=True,
            defaults={
                'name_en': 'Jane Doe',
                'gender': 'female', 
                'created_by': admin_user,
                'notes': 'عميل افتراضي للإناث - يُستخدم عندما لا يُعرف اسم العميل'
            }
        )

        # Report results
        if male_created:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created default male customer: {male_customer.name_ar}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'ℹ Default male customer already exists: {male_customer.name_ar}')
            )

        if female_created:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created default female customer: {female_customer.name_ar}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'ℹ Default female customer already exists: {female_customer.name_ar}')
            )

        # Show summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('DEFAULT CUSTOMERS SUMMARY'))
        self.stdout.write('='*50)
        
        for customer in Customer.objects.filter(is_placeholder=True):
            self.stdout.write(f'ID: {customer.id} | {customer.name_ar} ({customer.name_en}) | {customer.get_gender_display()}')
        
        # Check sales assignment
        from inventory.models import Sale
        sales_with_male = Sale.objects.filter(customer=male_customer).count()
        sales_with_female = Sale.objects.filter(customer=female_customer).count()
        sales_without_customer = Sale.objects.filter(customer__isnull=True).count()
        
        self.stdout.write('\n' + '-'*30)
        self.stdout.write('SALES ASSIGNMENT SUMMARY')
        self.stdout.write('-'*30)
        self.stdout.write(f'Sales assigned to فلان: {sales_with_male}')
        self.stdout.write(f'Sales assigned to فلانة: {sales_with_female}') 
        self.stdout.write(f'Sales without customer: {sales_without_customer}')
        
        if sales_without_customer > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'\nℹ There are {sales_without_customer} sales without customers. '
                    'Run the migration or manually assign them.'
                )
            )

    def get_or_create_admin_user(self):
        """Get or create an admin user"""
        # Try to get an existing superuser
        admin_user = User.objects.filter(is_superuser=True).first()
        
        if admin_user:
            self.stdout.write(f'Using existing admin user: {admin_user.username}')
            return admin_user
        
        # Try to get any staff user
        staff_user = User.objects.filter(is_staff=True).first()
        
        if staff_user:
            self.stdout.write(f'Using existing staff user: {staff_user.username}')
            return staff_user
        
        # Get any user
        any_user = User.objects.first()
        
        if any_user:
            self.stdout.write(f'Using existing user: {any_user.username}')
            return any_user
        
        # Create a new admin user
        self.stdout.write(
            self.style.WARNING('No users found. Creating default admin user...')
        )
        
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@shop.local',
            password='admin123',
            is_superuser=True,
            is_staff=True,
            first_name='Admin',
            last_name='User'
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created admin user: {admin_user.username} (password: admin123)')
        )
        
        return admin_user