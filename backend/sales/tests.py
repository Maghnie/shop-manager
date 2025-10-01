from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from inventory.models import Product, ProductType, ProductBrand, Inventory
from sales.models import Sale, SaleItem, Invoice

User = get_user_model()


class SaleModelTestCase(TestCase):
    """Test Sale model calculations and properties"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

        # Create product type and brand
        self.product_type = ProductType.objects.create(
            name_en='Test Type',
            name_ar='نوع اختبار'
        )
        self.brand = ProductBrand.objects.create(
            name_en='Test Brand',
            name_ar='علامة تجارية اختبارية'
        )

        # Create test products with inventory
        self.product1 = Product.objects.create(
            type=self.product_type,
            brand=self.brand,
            cost_price=Decimal('10.00'),
            selling_price=Decimal('15.00'),
            size='M',
            created_by=self.user
        )
        Inventory.objects.create(
            product=self.product1,
            quantity_in_stock=100,
            minimum_stock_level=10
        )

        self.product2 = Product.objects.create(
            type=self.product_type,
            brand=self.brand,
            cost_price=Decimal('20.00'),
            selling_price=Decimal('30.00'),
            size='L',
            created_by=self.user
        )
        Inventory.objects.create(
            product=self.product2,
            quantity_in_stock=50,
            minimum_stock_level=5
        )

    def test_sale_calculations_no_discount_no_tax(self):
        """
        Test: Basic sales calculation without discount or tax

        Given: A sale with 2 items:
               - Product 1: quantity=2, unit_price=15, cost_price=10
               - Product 2: quantity=1, unit_price=30, cost_price=20
               No discount, no tax

        When: Sale properties are accessed

        Then: Expected calculated values:
              - Subtotal: (2 × 15) + (1 × 30) = 60
              - Total Cost: (2 × 10) + (1 × 20) = 40
              - Discount Applied: 0
              - Tax Amount: 0
              - Final Total: 60
              - Net Profit: 60 - 40 = 20
              - Profit Percentage: (20 / 40) × 100 = 50%

        This tests the core calculation logic in the Sale model's @property methods.
        """
        sale = Sale.objects.create(
            customer_name='Test Customer',
            payment_method='cash',
            discount_amount=Decimal('0.00'),
            tax_percentage=Decimal('0.00'),
            created_by=self.user
        )

        SaleItem.objects.create(
            sale=sale,
            product=self.product1,
            quantity=2,
            unit_price=self.product1.selling_price
        )
        SaleItem.objects.create(
            sale=sale,
            product=self.product2,
            quantity=1,
            unit_price=self.product2.selling_price
        )

        # Refresh to get computed properties
        sale.refresh_from_db()

        # Subtotal: (2 * 15) + (1 * 30) = 60
        self.assertEqual(sale.subtotal, Decimal('60.00'))

        # Total cost: (2 * 10) + (1 * 20) = 40
        self.assertEqual(sale.total_cost, Decimal('40.00'))

        # No discount or tax
        self.assertEqual(sale.discount_applied, Decimal('0.00'))
        self.assertEqual(sale.tax_amount, Decimal('0.00'))

        # Final total = subtotal
        self.assertEqual(sale.final_total, Decimal('60.00'))

        # Net profit: 60 - 40 = 20
        self.assertEqual(sale.net_profit, Decimal('20.00'))

        # Profit percentage: (20 / 40) * 100 = 50%
        self.assertEqual(sale.profit_percentage, Decimal('50.00'))

    def test_sale_calculations_with_discount(self):
        """
        Test: Sales calculation with flat discount amount

        Given: A sale with 1 item and a discount of 10:
               - Product 1: quantity=2, unit_price=15
               - Discount: 10

        When: Sale properties are calculated

        Then: Expected results:
              - Subtotal: 2 × 15 = 30
              - Discount Applied: 10
              - Final Total: 30 - 10 = 20

        This verifies that flat discount amounts are correctly subtracted from subtotal.
        """
        sale = Sale.objects.create(
            customer_name='Test Customer',
            payment_method='cash',
            discount_amount=Decimal('10.00'),
            tax_percentage=Decimal('0.00'),
            created_by=self.user
        )

        SaleItem.objects.create(
            sale=sale,
            product=self.product1,
            quantity=2,
            unit_price=self.product1.selling_price
        )

        sale.refresh_from_db()

        # Subtotal: 2 * 15 = 30
        self.assertEqual(sale.subtotal, Decimal('30.00'))

        # Discount applied
        self.assertEqual(sale.discount_applied, Decimal('10.00'))

        # Final total: 30 - 10 = 20
        self.assertEqual(sale.final_total, Decimal('20.00'))

    def test_sale_calculations_with_tax(self):
        """
        Test: Sales calculation with tax percentage

        Given: A sale with 1 item and 15% tax:
               - Product 1: quantity=2, unit_price=15
               - Tax: 15%

        When: Tax calculations are performed

        Then: Expected results:
              - Subtotal: 2 × 15 = 30
              - Tax Amount: 30 × 0.15 = 4.50
              - Final Total: 30 + 4.50 = 34.50

        This verifies that tax is calculated as a percentage of the subtotal.
        """
        sale = Sale.objects.create(
            customer_name='Test Customer',
            payment_method='cash',
            discount_amount=Decimal('0.00'),
            tax_percentage=Decimal('15.00'),  # 15% tax
            created_by=self.user
        )

        SaleItem.objects.create(
            sale=sale,
            product=self.product1,
            quantity=2,
            unit_price=self.product1.selling_price
        )

        sale.refresh_from_db()

        # Subtotal: 2 * 15 = 30
        self.assertEqual(sale.subtotal, Decimal('30.00'))

        # Tax: 30 * 0.15 = 4.50
        self.assertEqual(sale.tax_amount, Decimal('4.50'))

        # Final total: 30 + 4.50 = 34.50
        self.assertEqual(sale.final_total, Decimal('34.50'))

    def test_sale_calculations_with_discount_and_tax(self):
        """
        Test: Sales calculation with both discount and tax

        Given: A sale with discount and tax:
               - Product 1: quantity=2, unit_price=15, cost_price=10
               - Discount: 5
               - Tax: 10%

        When: Combined calculations are performed

        Then: Expected results:
              - Subtotal: 2 × 15 = 30
              - Discount Applied: 5
              - Discounted Amount: 30 - 5 = 25
              - Tax Amount: 25 × 0.10 = 2.50 (tax applied AFTER discount)
              - Final Total: 25 + 2.50 = 27.50

        This confirms the order of operations: discount is applied first,
        then tax is calculated on the discounted amount.
        """
        sale = Sale.objects.create(
            customer_name='Test Customer',
            payment_method='cash',
            discount_amount=Decimal('5.00'),
            tax_percentage=Decimal('10.00'),  # 10% tax
            created_by=self.user
        )

        SaleItem.objects.create(
            sale=sale,
            product=self.product1,
            quantity=2,
            unit_price=self.product1.selling_price
        )

        sale.refresh_from_db()

        # Subtotal: 2 * 15 = 30
        self.assertEqual(sale.subtotal, Decimal('30.00'))

        # Discount
        self.assertEqual(sale.discount_applied, Decimal('5.00'))

        # Tax on discounted amount: (30 - 5) * 0.10 = 2.50
        self.assertEqual(sale.tax_amount, Decimal('2.50'))

        # Final total: 30 - 5 + 2.50 = 27.50
        self.assertEqual(sale.final_total, Decimal('27.50'))


class SaleAPITestCase(TestCase):
    """Test Sale API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        # Create test products
        self.product_type = ProductType.objects.create(
            name_en='Test Type',
            name_ar='نوع اختبار'
        )
        self.brand = ProductBrand.objects.create(
            name_en='Test Brand',
            name_ar='علامة تجارية اختبارية'
        )

        self.product = Product.objects.create(
            type=self.product_type,
            brand=self.brand,
            cost_price=Decimal('10.00'),
            selling_price=Decimal('15.00'),
            size='M',
            created_by=self.user
        )
        self.inventory = Inventory.objects.create(
            product=self.product,
            quantity_in_stock=100,
            minimum_stock_level=10
        )

    def test_create_sale_without_items_fails(self):
        """
        Test: Validate that creating a sale without items fails (B/F Test #1)

        Given: Sale data with an empty items array

        When: POST request is made to create the sale

        Then: Response should be HTTP 400 BAD REQUEST
              Error message should mention 'items'

        This ensures data integrity by preventing empty sales from being created.
        Corresponds to frontend validation test.
        """
        sale_data = {
            'customer_name': 'Test Customer',
            'payment_method': 'cash',
            'discount_amount': 0,
            'tax_percentage': 0,
            'items': []  # Empty items
        }

        response = self.client.post('/api/v1/sales/sales/', sale_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('items', str(response.data).lower())

    def test_create_sale_with_items_success(self):
        """
        Test: Successfully create a sale with items (B/F Test #3)

        Given: Valid sale data with one item (quantity=5)
               Initial stock: 100 units

        When: POST request creates the sale

        Then: Expected outcomes:
              - HTTP 201 CREATED response
              - Sale record created in database
              - Sale has 1 item
              - Inventory reduced by 5 (100 -> 95)
              - Sale status is 'pending'

        This tests the core sale creation workflow including inventory updates.
        """
        sale_data = {
            'customer_name': 'Test Customer',
            'customer_phone': '1234567890',
            'customer_address': 'Test Address',
            'payment_method': 'cash',
            'discount_amount': 0,
            'tax_percentage': 0,
            'items': [
                {
                    'product': self.product.id,
                    'quantity': 5,
                    'unit_price': str(self.product.selling_price),
                    'cost_price': str(self.product.cost_price)
                }
            ]
        }

        initial_stock = self.inventory.quantity_in_stock
        response = self.client.post('/api/v1/sales/sales/', sale_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)

        # Verify sale was created
        sale = Sale.objects.get(id=response.data['id'])
        self.assertEqual(sale.customer_name, 'Test Customer')
        self.assertEqual(sale.items.count(), 1)

        # Verify inventory was reduced
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_in_stock, initial_stock - 5)

        # Verify sale status
        self.assertEqual(sale.status, 'pending')

    def test_create_sale_exceeding_stock_fails(self):
        """
        Test: Validate stock limit enforcement

        Given: Sale with quantity (150) exceeding available stock (100)

        When: Attempt to create the sale

        Then: HTTP 400 BAD REQUEST response
              Sale is not created
              Inventory remains unchanged

        This prevents overselling and maintains inventory integrity.
        """
        sale_data = {
            'customer_name': 'Test Customer',
            'payment_method': 'cash',
            'discount_amount': 0,
            'tax_percentage': 0,
            'items': [
                {
                    'product': self.product.id,
                    'quantity': 150,  # More than available stock (100)
                    'unit_price': str(self.product.selling_price),
                    'cost_price': str(self.product.cost_price)
                }
            ]
        }

        response = self.client.post('/api/v1/sales/sales/', sale_data, format='json')

        # Should fail validation
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_complete_sale_creates_invoice(self):
        """
        Test: Invoice auto-generation on sale completion (B/F Test #3 continued)

        Given: A pending sale with items

        When: POST to /sales/{id}/complete/ endpoint

        Then: Expected outcomes:
              - HTTP 200 OK response
              - Sale status changes to 'completed'
              - Invoice is created with valid invoice_number
              - Response includes invoice_id and invoice_number

        This tests the invoice generation workflow that occurs when sales are finalized.
        """
        # Create a pending sale
        sale = Sale.objects.create(
            customer_name='Test Customer',
            payment_method='cash',
            discount_amount=Decimal('0.00'),
            tax_percentage=Decimal('0.00'),
            status='pending',
            created_by=self.user
        )
        SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=2,
            unit_price=self.product.selling_price
        )

        # Complete the sale
        response = self.client.post(f'/api/v1/sales/sales/{sale.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('invoice_id', response.data)

        # Verify sale status changed
        sale.refresh_from_db()
        self.assertEqual(sale.status, 'completed')

        # Verify invoice was created
        invoice = Invoice.objects.get(id=response.data['invoice_id'])
        self.assertEqual(invoice.sale, sale)
        self.assertIsNotNone(invoice.invoice_number)

    def test_cancel_sale_restores_inventory(self):
        """
        Test: Inventory restoration on sale cancellation

        Given: A sale with quantity=10 that reduced inventory

        When: POST to /sales/{id}/cancel/ endpoint

        Then: Expected outcomes:
              - HTTP 200 OK response
              - Inventory restored to original quantity
              - Sale status changes to 'cancelled'

        This ensures inventory accuracy by reversing stock deductions when sales are cancelled.
        """
        # Create a sale
        sale = Sale.objects.create(
            customer_name='Test Customer',
            payment_method='cash',
            discount_amount=Decimal('0.00'),
            tax_percentage=Decimal('0.00'),
            status='pending',
            created_by=self.user
        )
        SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=10,
            unit_price=self.product.selling_price
        )

        # Manually reduce inventory (simulating sale creation)
        initial_stock = self.inventory.quantity_in_stock
        self.inventory.quantity_in_stock -= 10
        self.inventory.save()

        # Cancel the sale
        response = self.client.post(f'/api/v1/sales/sales/{sale.id}/cancel/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify inventory was restored
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_in_stock, initial_stock)

        # Verify sale status
        sale.refresh_from_db()
        self.assertEqual(sale.status, 'cancelled')

    def test_cannot_cancel_already_cancelled_sale(self):
        """
        Test: Prevent double-cancellation of sales

        Given: A sale with status='cancelled'

        When: Attempt to cancel it again

        Then: HTTP 400 BAD REQUEST response

        This prevents duplicate inventory restoration and maintains data consistency.
        """
        sale = Sale.objects.create(
            customer_name='Test Customer',
            payment_method='cash',
            status='cancelled',
            created_by=self.user
        )

        response = self.client.post(f'/api/v1/sales/sales/{sale.id}/cancel/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SaleItemTestCase(TestCase):
    """Test SaleItem model calculations"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

        product_type = ProductType.objects.create(
            name_en='Test Type',
            name_ar='نوع اختبار'
        )

        self.product = Product.objects.create(
            type=product_type,
            cost_price=Decimal('10.00'),
            selling_price=Decimal('15.00'),
            size='M',
            created_by=self.user
        )

        self.sale = Sale.objects.create(
            customer_name='Test Customer',
            payment_method='cash',
            created_by=self.user
        )

    def test_sale_item_total_price_calculation(self):
        """
        Test: Sale item total price calculation (B/F Test #4)

        Given: SaleItem with quantity=3, unit_price=15

        When: total_price property is accessed

        Then: total_price = 3 × 15 = 45

        This tests the @property calculation at the item level.
        """
        item = SaleItem.objects.create(
            sale=self.sale,
            product=self.product,
            quantity=3,
            unit_price=Decimal('15.00')
        )

        # Total price: 3 * 15 = 45
        self.assertEqual(item.total_price, Decimal('45.00'))

    def test_sale_item_profit_calculation(self):
        """
        Test: Sale item profit calculations (B/F Test #4 continued)

        Given: SaleItem with:
               - quantity=2
               - unit_price=15
               - product.cost_price=10

        When: Profit properties are accessed

        Then: Expected calculations:
              - profit_per_item = 15 - 10 = 5
              - total_profit = 5 × 2 = 10
              - profit_percentage = (5 / 10) × 100 = 50%

        This verifies profit calculation logic at the item level.
        """
        item = SaleItem.objects.create(
            sale=self.sale,
            product=self.product,
            quantity=2,
            unit_price=Decimal('15.00')
        )

        # Profit per item: 15 - 10 = 5
        self.assertEqual(item.profit_per_item, Decimal('5.00'))

        # Total profit: 5 * 2 = 10
        self.assertEqual(item.total_profit, Decimal('10.00'))

        # Profit percentage: (5 / 10) * 100 = 50%
        self.assertEqual(item.profit_percentage, Decimal('50.00'))
