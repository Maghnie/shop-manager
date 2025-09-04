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
        parser.add_argument(
            '--constant',
            type=int,
            help='Set constant inventory quantity for all products',
        )
        parser.add_argument(
            '--semi-random',
            action='store_true',
            help='Use semi-random distribution (cushiony, near-threshold, few out-of-stock)',
        )

    def handle(self, *args, **options):
        products = Product.objects.all()
        
        if not products.exists():
            self.stdout.write(
                self.style.ERROR('No products found. Create products first.')
            )
            return

        # Validate arguments
        if options['constant'] and options['semi_random']:
            self.stdout.write(
                self.style.ERROR('Cannot use both --constant and --semi-random flags together.')
            )
            return

        created_count = 0
        updated_count = 0

        for product in products:
            # Determine stock quantity based on options
            if options['constant']:
                stock_quantity = options['constant']
            elif options['semi_random']:
                stock_quantity = self.generate_semi_random_stock(product)
            else:
                stock_quantity = self.generate_stock_quantity()

            # Generate realistic inventory data
            inventory, created = Inventory.objects.get_or_create(
                product=product,
                defaults={
                    'quantity_in_stock': stock_quantity,
                    'minimum_stock_level': self.generate_minimum_level(),
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'Created inventory for: {product}')
            elif options['reset']:
                inventory.quantity_in_stock = stock_quantity
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
    
    def generate_semi_random_stock(self, product):
        """
        Generate semi-random stock based on minimum stock level threshold.
        Distribution:
        - 60% cushiony stock (5-10x above threshold)
        - 30% near threshold (2-2.5x threshold) 
        - 10% out of stock (0)
        """
        # Get or create inventory to access minimum_stock_level
        inventory, _ = Inventory.objects.get_or_create(
            product=product,
            defaults={'minimum_stock_level': self.generate_minimum_level()}
        )
        
        threshold = inventory.minimum_stock_level
        rand = random.random()
        
        if rand < 0.1:  # 10% out of stock
            return 0
        elif rand < 0.4:  # 30% near threshold (including some below threshold)
            return random.randint(2, int(threshold * 2.5))
        else:  # 60% cushiony stock
            return random.randint(threshold * 5, threshold * 10)