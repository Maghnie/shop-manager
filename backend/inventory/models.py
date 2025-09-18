from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.core.exceptions import ValidationError


class ProductType(models.Model):
    """Predefined product types"""
    name_en = models.CharField(max_length=100, unique=True)
    name_ar = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name_ar']
    
    def __str__(self) -> str:
        return self.name_ar

class Brand(models.Model):
    """Predefined brands"""
    name_en = models.CharField(max_length=100, unique=True)
    name_ar = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name_ar']
    
    def __str__(self) -> str:
        return self.name_ar

class Material(models.Model):
    """Predefined materials"""
    name_en = models.CharField(max_length=100, unique=True)
    name_ar = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name_ar']
    
    def __str__(self) -> str:
        return self.name_ar

class Product(models.Model):
    """Main product model with all required fields"""
    
    # Required fields
    type = models.ForeignKey(ProductType, on_delete=models.CASCADE, verbose_name="النوع")
    cost_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="سعر التكلفة"
    )
    selling_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="سعر البيع"
    )
    
    # Optional fields
    brand = models.ForeignKey(
        Brand, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="العلامة التجارية"
    )
    size = models.CharField(max_length=100, blank=True, verbose_name="الحجم")
    weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name="الوزن"
    )
    material = models.ForeignKey(
        Material, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="المادة"
    )
    tags = models.TextField(blank=True, help_text="Comma-separated tags", verbose_name="العلامات")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['brand']),
            models.Index(fields=['material']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self) -> str:
        brand_name = f" - {self.brand.name_ar}" if self.brand else ""
        return f"{self.type.name_ar}{brand_name}"
    
    @property
    def profit(self) -> Decimal:
        """Calculate profit in USD"""
        return self.selling_price - self.cost_price
    
    @property
    def profit_percentage(self) -> Decimal:
        """Calculate profit percentage"""
        if self.cost_price > 0:
            return Decimal((self.profit / self.cost_price) * 100)
        return 0.0
    
    @property
    def tags_list(self) -> list[str]:
        """Return tags as a list"""
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
    
    def save(self, *args, **kwargs):
        """Override save to perform validation"""
        if self.selling_price <= self.cost_price:
            from django.core.exceptions import ValidationError
            raise ValidationError("Selling price must be greater than cost price")
        super().save(*args, **kwargs)

class Inventory(models.Model):
    """Track product quantities in stock"""
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    quantity_in_stock = models.PositiveIntegerField(default=0, verbose_name="الكمية المتوفرة")
    minimum_stock_level = models.PositiveIntegerField(default=5, verbose_name="الحد الأدنى للمخزون")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "مخزون"
        verbose_name_plural = "المخازن"

    def __str__(self):
        return f"{self.product} - {self.quantity_in_stock} قطعة"

    @property
    def is_low_stock(self):
        """Check if product is running low on stock"""
        return self.quantity_in_stock <= self.minimum_stock_level

    @property
    def is_out_of_stock(self):
        """Check if product is out of stock"""
        return self.quantity_in_stock == 0