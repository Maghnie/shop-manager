from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from inventory.models import Product, ProductType, Brand, Material
from decimal import Decimal

class Command(BaseCommand):
    help = 'Load sample data for plastic and paper bags'

    def handle(self, *args, **options):
        # Create superuser if it doesn't exist
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123'
            )
            self.stdout.write('Created admin user (admin/admin123)')

        # Create product types
        bag_types = [
            ('Plastic Bag', 'كيس بلاستيك'),
            ('Paper Bag', 'كيس ورق'),
            ('Shopping Bag', 'كيس تسوق'),
            ('Garbage Bag', 'كيس قمامة'),
            ('Food Storage Bag', 'كيس حفظ طعام'),
        ]

        for en_name, ar_name in bag_types:
            ProductType.objects.get_or_create(
                name_en=en_name,
                defaults={'name_ar': ar_name}
            )

        # Create brands
        brands = [
            ('Generic', 'عام'),
            ('EcoBag', 'إيكو باج'),
            ('StrongHold', 'سترونغ هولد'),
            ('FlexiPack', 'فليكسي باك'),
            ('GreenChoice', 'الخيار الأخضر'),
        ]

        for en_name, ar_name in brands:
            Brand.objects.get_or_create(
                name_en=en_name,
                defaults={'name_ar': ar_name}
            )

        # Create materials
        materials = [
            ('HDPE', 'بولي إيثيلين عالي الكثافة'),
            ('LDPE', 'بولي إيثيلين منخفض الكثافة'),
            ('Recycled Paper', 'ورق معاد التدوير'),
            ('Kraft Paper', 'ورق كرافت'),
            ('Biodegradable Plastic', 'بلاستيك قابل للتحلل'),
        ]

        for en_name, ar_name in materials:
            Material.objects.get_or_create(
                name_en=en_name,
                defaults={'name_ar': ar_name}
            )

        # Get admin user
        admin_user = User.objects.get(username='admin')

        # Sample products data
        sample_products = [
            {
                'type': 'Plastic Bag',
                'brand': 'Generic',
                'material': 'HDPE',
                'size': 'Small (20x30cm)',
                'weight': Decimal('5.0'),
                'cost_price': Decimal('0.05'),
                'selling_price': Decimal('0.10'),
                'tags': 'small, transparent, household'
            },
            {
                'type': 'Plastic Bag',
                'brand': 'StrongHold',
                'material': 'HDPE',
                'size': 'Medium (30x40cm)',
                'weight': Decimal('8.0'),
                'cost_price': Decimal('0.08'),
                'selling_price': Decimal('0.15'),
                'tags': 'medium, strong, multipurpose'
            },
            {
                'type': 'Shopping Bag',
                'brand': 'EcoBag',
                'material': 'Recycled Paper',
                'size': 'Large (40x35x15cm)',
                'weight': Decimal('45.0'),
                'cost_price': Decimal('0.25'),
                'selling_price': Decimal('0.60'),
                'tags': 'eco-friendly, recyclable, shopping'
            },
            {
                'type': 'Garbage Bag',
                'brand': 'StrongHold',
                'material': 'LDPE',
                'size': '50L',
                'weight': Decimal('25.0'),
                'cost_price': Decimal('0.15'),
                'selling_price': Decimal('0.35'),
                'tags': 'garbage, heavy-duty, black'
            },
            {
                'type': 'Food Storage Bag',
                'brand': 'FlexiPack',
                'material': 'LDPE',
                'size': '1L',
                'weight': Decimal('3.0'),
                'cost_price': Decimal('0.03'),
                'selling_price': Decimal('0.08'),
                'tags': 'food-safe, freezer, transparent'
            },
            {
                'type': 'Paper Bag',
                'brand': 'GreenChoice',
                'material': 'Kraft Paper',
                'size': 'Small (15x20x8cm)',
                'weight': Decimal('20.0'),
                'cost_price': Decimal('0.12'),
                'selling_price': Decimal('0.25'),
                'tags': 'kraft, brown, natural'
            },
            {
                'type': 'Shopping Bag',
                'brand': 'EcoBag',
                'material': 'Biodegradable Plastic',
                'size': 'Medium (35x40x12cm)',
                'weight': Decimal('15.0'),
                'cost_price': Decimal('0.30'),
                'selling_price': Decimal('0.70'),
                'tags': 'biodegradable, eco, shopping'
            },
            {
                'type': 'Plastic Bag',
                'brand': 'Generic',
                'material': 'LDPE',
                'size': 'Extra Large (50x60cm)',
                'weight': Decimal('12.0'),
                'cost_price': Decimal('0.10'),
                'selling_price': Decimal('0.20'),
                'tags': 'extra-large, storage, transparent'
            }
        ]

        # Create additional variations
        sizes = ['XS (10x15cm)', 'S (20x25cm)', 'M (30x35cm)', 'L (40x45cm)', 'XL (50x60cm)']
        
        created_count = 0
        for base_product in sample_products:
            for i, size in enumerate(sizes):
                if Product.objects.filter(
                    type__name_en=base_product['type'],
                    brand__name_en=base_product['brand'],
                    size=size
                ).exists():
                    continue

                product_data = base_product.copy()
                product_data['size'] = size
                
                # Vary prices based on size
                size_multiplier = 1 + (i * 0.2)
                product_data['cost_price'] = base_product['cost_price'] * Decimal(str(size_multiplier))
                product_data['selling_price'] = base_product['selling_price'] * Decimal(str(size_multiplier))
                product_data['weight'] = base_product['weight'] * Decimal(str(size_multiplier))

                Product.objects.create(
                    type=ProductType.objects.get(name_en=product_data['type']),
                    brand=Brand.objects.get(name_en=product_data['brand']),
                    material=Material.objects.get(name_en=product_data['material']),
                    size=product_data['size'],
                    weight=product_data['weight'],
                    cost_price=product_data['cost_price'],
                    selling_price=product_data['selling_price'],
                    tags=product_data['tags'],
                    created_by=admin_user
                )
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} sample products'
            )
        )
