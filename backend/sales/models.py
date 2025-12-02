from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from django.core.exceptions import ValidationError
from customers.models import Customer
from inventory.models import Product


class Sale(models.Model):
    """Main sales transaction model"""
    PAYMENT_METHODS = [
        ('cash', 'نقدي'),
        ('card', 'بطاقة'),
        ('bank_transfer', 'تحويل بنكي'),
        ('credit', 'آجل'),
    ]

    STATUS_CHOICES = [
        ('pending', 'معلق'),
        ('completed', 'مكتمل'),
        ('cancelled', 'ملغي'),
    ]

    # Basic info
    sale_number = models.CharField(max_length=20, unique=True, verbose_name="رقم البيعة")
    sale_date = models.DateTimeField(default=timezone.now, verbose_name="تاريخ البيع")

    # Customer info (optional for walk-in customers)
    customer_name = models.CharField(max_length=200, blank=True, verbose_name="اسم العميل")
    customer_phone = models.CharField(max_length=20, blank=True, verbose_name="رقم الهاتف")
    customer_address = models.TextField(blank=True, verbose_name="العنوان")

    # Sale details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash', verbose_name="طريقة الدفع")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed', verbose_name="الحالة")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="قيمة الخصم")
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="نسبة الضريبة")
    notes = models.TextField(blank=True, verbose_name="ملاحظات")

    # Reference to Customer
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales',
        verbose_name="العميل",
        help_text="العميل المرتبط بهذه البيعة"
    )

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="البائع")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-sale_date']
        verbose_name = "عملية بيع"
        verbose_name_plural = "عمليات البيع"
        indexes = [
            models.Index(fields=['sale_date']),
            models.Index(fields=['status', 'sale_date']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        customer_name = self.customer.display_name if self.customer else 'عميل مباشر'
        return f"بيعة #{self.sale_number} - {customer_name}"

    def save(self, *args, **kwargs):
        if not self.sale_number:
            self.sale_number = self.generate_sale_number()

        # Set default customer if none provided
        if not self.customer_id:
            self.customer = Customer.get_default_male_customer()

        super().save(*args, **kwargs)

    @staticmethod
    def generate_sale_number():
        """Generate unique sale number"""
        import datetime
        today = datetime.date.today()
        prefix = f"S{today.strftime('%Y%m%d')}"

        # Find the last sale number for today
        last_sale = Sale.objects.filter(
            sale_number__startswith=prefix
        ).order_by('sale_number').last()

        if last_sale:
            # Extract the sequence number and increment
            sequence = int(last_sale.sale_number[-3:]) + 1
        else:
            sequence = 1

        return f"{prefix}{sequence:03d}"

    @property
    def customer_display(self):
        """Get customer display name or fallback"""
        if self.customer:
            return self.customer.display_name
        elif self.customer_name:
            return self.customer_name
        else:
            return 'عميل مباشر'

    @property
    def subtotal(self):
        """Calculate subtotal before discount and tax"""
        return sum(item.total_price for item in self.items.all())

    @property
    def total_cost(self):
        """Calculate total cost of goods sold"""
        return sum(item.product.cost_price * item.quantity for item in self.items.all())

    @property
    def gross_profit(self):
        """Calculate gross profit before discount and tax"""
        return self.subtotal - self.total_cost

    @property
    def discount_applied(self):
        """Calculate actual discount amount"""
        return self.discount_amount

    @property
    def tax_amount(self):
        """Calculate tax amount"""
        taxable_amount = self.subtotal - self.discount_applied
        return (taxable_amount * self.tax_percentage) / 100

    @property
    def final_total(self):
        """Calculate final total after discount and tax"""
        return self.subtotal - self.discount_applied + self.tax_amount

    @property
    def net_profit(self):
        """Calculate net profit after discount and tax"""
        return self.final_total - self.total_cost
    
    @property
    def profit_margin(self) -> Decimal:
        """Calculate profit margin per sale"""
        if self.total_cost > 0:
            return Decimal((self.net_profit / self.final_total) * 100)
        return 0.0

    @property
    def profit_percentage(self):
        """Calculate profit percentage"""
        if self.total_cost > 0:
            return (self.net_profit / self.total_cost) * 100
        return 0


class SaleItem(models.Model):
    """Individual items in a sale"""
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items', verbose_name="البيعة")
    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE, verbose_name="المنتج")
    quantity = models.PositiveIntegerField(verbose_name="الكمية")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="سعر الوحدة")

    class Meta:
        verbose_name = "منتج مباع"
        verbose_name_plural = "المنتجات المباعة"
        constraints = [ # Prevent duplicate products in same sale
            models.UniqueConstraint(fields=['sale', 'product'], name='unique_sale_product')
        ]
        indexes = [
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f"{self.product} x{self.quantity} - ${self.total_price}"

    @property
    def total_price(self):
        """Calculate total price for this item"""
        return self.quantity * self.unit_price

    @property
    def profit_per_item(self):
        """Calculate profit per unit"""
        return self.unit_price - self.product.cost_price

    @property
    def total_profit(self):
        """Calculate total profit for this item"""
        return self.profit_per_item * self.quantity
    
    @property
    def profit_margin(self):
        """Calculate profit margin for this item"""
        if self.product.cost_price > 0:
            return (self.profit_per_item / self.product.selling_price) * 100
        return 0.0

    @property
    def profit_percentage(self):
        """Calculate profit percentage for this item"""
        if self.product.cost_price > 0:
            return (self.profit_per_item / self.product.cost_price) * 100
        return 0

    def clean(self):
        """Validate before saving"""
        # Check if enough stock is available
        if self.product.inventory.quantity_in_stock < self.quantity:
            raise ValidationError(f'المخزون غير كافي. متوفر: {self.product.inventory.quantity_in_stock}')

    def save(self, *args, **kwargs):
        self.clean()

        # Set unit price to current selling price if not provided
        if not self.unit_price:
            self.unit_price = self.product.selling_price

        is_new = self.pk is None
        old_quantity = 0

        if not is_new:
            old_instance = SaleItem.objects.get(pk=self.pk)
            old_quantity = old_instance.quantity

        super().save(*args, **kwargs)

        # Update inventory
        if is_new:
            # New sale item - reduce stock
            self.product.inventory.quantity_in_stock -= self.quantity
        else:
            # Updated sale item - adjust stock
            quantity_diff = self.quantity - old_quantity
            self.product.inventory.quantity_in_stock -= quantity_diff

        self.product.inventory.save()


class Invoice(models.Model):
    """Invoice model linked to sales"""
    invoice_number = models.CharField(max_length=20, unique=True, verbose_name="رقم الفاتورة")
    sale = models.OneToOneField(Sale, on_delete=models.CASCADE, related_name='invoice', verbose_name="البيعة")

    # Invoice-specific details
    invoice_date = models.DateTimeField(default=timezone.now, verbose_name="تاريخ الفاتورة")
    due_date = models.DateField(null=True, blank=True, verbose_name="تاريخ الاستحقاق")

    # Company details (can be moved to settings later)
    company_name = models.CharField(max_length=200, default="اسم الشركة", verbose_name="اسم الشركة")
    company_address = models.TextField(default="عنوان الشركة", verbose_name="عنوان الشركة")
    company_phone = models.CharField(max_length=50, default="رقم الهاتف", verbose_name="رقم هاتف الشركة")
    company_email = models.EmailField(blank=True, verbose_name="ايميل الشركة")

    # Status
    is_printed = models.BooleanField(default=False, verbose_name="تم طباعتها")
    printed_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الطباعة")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date']
        verbose_name = "فاتورة"
        verbose_name_plural = "الفواتير"

    def __str__(self):
        return f"فاتورة #{self.invoice_number}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Use the sale's date if available, otherwise today's date
            invoice_date = self.sale.sale_date.date() if self.sale else None
            self.invoice_number = self.generate_invoice_number(for_date=invoice_date)

        # Override auto_now_add behavior to use the sale's date
        if self.sale and not self.pk:  # Only on creation
            self.invoice_date = self.sale.sale_date

        super().save(*args, **kwargs)

    @staticmethod
    def generate_invoice_number(for_date=None):
        """Generate unique invoice number for a specific date"""
        import datetime
        target_date = for_date if for_date else datetime.date.today()
        prefix = f"INV{target_date.strftime('%Y%m%d')}"

        # Find the last invoice number for the target date
        last_invoice = Invoice.objects.filter(
            invoice_number__startswith=prefix
        ).order_by('invoice_number').last()

        if last_invoice:
            # Extract the sequence number and increment
            sequence = int(last_invoice.invoice_number[-3:]) + 1
        else:
            sequence = 1

        return f"{prefix}{sequence:03d}"

    def mark_as_printed(self):
        """Mark invoice as printed"""
        from django.utils import timezone
        self.is_printed = True
        self.printed_at = timezone.now()
        self.save()