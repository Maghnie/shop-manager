# management/commands/populate_inventory.py

import random
from django.core.management.base import BaseCommand
from inventory.models import Product, Inventory

class Command(BaseCommand):
    help = 'Populate inventory data for existing products'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset existing inventory data',
        )

    def handle(self, *args, **options):
        products = Product.objects.all()
        
        if not products.exists():
            self.stdout.write(
                self.style.ERROR('No products found. Create products first.')
            )
            return

        created_count = 0
        updated_count = 0

        for product in products:
            # Generate realistic inventory data
            inventory, created = Inventory.objects.get_or_create(
                product=product,
                defaults={
                    'quantity_in_stock': self.generate_stock_quantity(),
                    'minimum_stock_level': self.generate_minimum_level(),
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'Created inventory for: {product}')
            elif options['reset']:
                inventory.quantity_in_stock = self.generate_stock_quantity()
                inventory.minimum_stock_level = self.generate_minimum_level()
                inventory.save()
                updated_count += 1
                self.stdout.write(f'Updated inventory for: {product}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {created_count} new inventories '
                f'and {updated_count} updates'
            )
        )

    def generate_stock_quantity(self):
        """Generate realistic stock quantities with some variety"""
        # 60% chance of good stock, 30% low stock, 10% out of stock
        rand = random.random()
        
        if rand < 0.1:  # Out of stock
            return 0
        elif rand < 0.4:  # Low stock
            return random.randint(1, 5)
        else:  # Good stock
            return random.randint(10, 100)
    
    def generate_minimum_level(self):
        """Generate minimum stock levels"""
        return random.randint(3, 10)