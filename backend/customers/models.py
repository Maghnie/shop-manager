from django.db import models
from django.db.models import Sum
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _


class Customer(models.Model):
    """Customer profiles for sales tracking"""
    
    GENDER_CHOICES = [
        ('male', 'ذكر'),
        ('female', 'أنثى'),
        ('other', 'أخرى'),
        ('not_specified', 'غير محدد'),
    ]
    
    # Basic Information
    name_ar = models.CharField(
        max_length=200, 
        verbose_name="الاسم بالعربية",
        help_text="اسم العميل بالعربية"
    )
    name_en = models.CharField(
        max_length=200, 
        blank=True,
        verbose_name="الاسم بالإنجليزية",
        help_text="اسم العميل بالإنجليزية (اختياري)"
    )
    
    # Contact Information
    phone = models.CharField(
        max_length=20, 
        blank=True,
        verbose_name="رقم الهاتف",
        help_text="رقم هاتف العميل"
    )
    email = models.EmailField(
        blank=True,
        verbose_name="البريد الإلكتروني"
    )
    address = models.TextField(
        blank=True,
        verbose_name="العنوان"
    )
    
    # Demographics
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        default='not_specified',
        verbose_name="الجنس"
    )
    birth_date = models.DateField(
        null=True, 
        blank=True,
        verbose_name="تاريخ الميلاد"
    )
    
    # Additional Information
    notes = models.TextField(
        blank=True,
        verbose_name="ملاحظات",
        help_text="أي ملاحظات إضافية عن العميل"
    )
    
    # System fields
    is_placeholder = models.BooleanField(
        default=False,
        verbose_name="عميل وهمي",
        help_text="يُستخدم للعملاء الافتراضيين مثل 'فلان' و 'فلانة'"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="نشط"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        verbose_name="أنشأ بواسطة"
    )
    
    class Meta:
        ordering = ['name_ar']
        verbose_name = "عميل"
        verbose_name_plural = "العملاء"
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['name_ar']),
            models.Index(fields=['gender']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self) -> str:
        return self.name_ar
    
    @property
    def display_name(self) -> str:
        """Get the best available name for display"""
        return self.name_ar or self.name_en or "عميل بدون اسم"
    
    @property
    def full_contact(self) -> str:
        """Get formatted contact information"""
        contact_parts = [self.display_name]
        if self.phone:
            contact_parts.append(self.phone)
        return " - ".join(contact_parts)
    
    @classmethod
    def get_default_male_customer(cls):
        """Get or create the default male customer"""
        customer, created = cls.objects.get_or_create(
            name_ar="فلان",
            is_placeholder=True,
            defaults={
                'name_en': 'John Doe',
                'gender': 'male',
                'created_by_id': 1,  # Assuming admin user exists
            }
        )
        return customer
    
    @classmethod
    def get_default_female_customer(cls):
        """Get or create the default female customer"""
        customer, created = cls.objects.get_or_create(
            name_ar="فلانة",
            is_placeholder=True,
            defaults={
                'name_en': 'Jane Doe',
                'gender': 'female',
                'created_by_id': 1,  # Assuming admin user exists
            }
        )
        return customer
    
    def get_total_spent(self):
        """Get total amount spent by this customer"""
        from inventory.models import Sale
        total = 0
        for sale in Sale.objects.filter(customer=self, status='completed'):
            total += sale.final_total  
        return total
    
    def get_purchase_count(self):
        """Get number of completed purchases"""
        from inventory.models import Sale
        return Sale.objects.filter(customer=self, status='completed').count()
    
    def get_last_purchase_date(self):
        """Get date of last purchase"""
        from inventory.models import Sale
        last_sale = Sale.objects.filter(customer=self, status='completed').first()
        return last_sale.sale_date if last_sale else None