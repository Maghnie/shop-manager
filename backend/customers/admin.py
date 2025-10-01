from django.contrib import admin
from django.db.models import Count, Sum, Q
from django.utils.html import format_html
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """Admin interface for Customer model"""
    
    list_display = [
        'name_ar', 
        'name_en', 
        'phone', 
        'gender',
        'purchase_count',
        'total_spent',
        'is_active',
        'is_placeholder',
        'created_at'
    ]
    
    list_filter = [
        'gender',
        'is_active', 
        'is_placeholder',
        'created_at',
    ]
    
    search_fields = [
        'name_ar',
        'name_en', 
        'phone',
        'email'
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at',
        'purchase_count',
        'total_spent',
        'last_purchase_date'
    ]
    
    fieldsets = (
        ('معلومات أساسية', {
            'fields': (
                ('name_ar', 'name_en'),
                'gender',
                ('phone', 'email'),
                'address',
            )
        }),
        ('معلومات إضافية', {
            'fields': (
                'birth_date',
                'notes',
            ),
            'classes': ('collapse',)
        }),
        ('حالة النظام', {
            'fields': (
                ('is_active', 'is_placeholder'),
                'created_by',
            )
        }),
        ('إحصائيات الشراء', {
            'fields': (
                'purchase_count',
                'total_spent', 
                'last_purchase_date',
            ),
            'classes': ('collapse',)
        }),
        ('طوابع زمنية', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',)
        }),
    )
    
    list_per_page = 50
    date_hierarchy = 'created_at'
    ordering = ['name_ar']
    
    def get_queryset(self, request):
        """Optimize queryset with related user and purchase stats"""
        qs = super().get_queryset(request)
        qs = qs.select_related('created_by').annotate(
            _purchase_count=Count('sales', filter=Q(sales__status='completed'))
        )
        return qs
    
    def purchase_count(self, obj):
        """Display purchase count"""
        count = obj.get_purchase_count()
        if count > 0:
            return format_html(
                '<strong style="color: green;">{}</strong>',
                count
            )
        return count
    purchase_count.short_description = 'عدد المشتريات'
    purchase_count.admin_order_field = '_purchase_count'
    
    def total_spent(self, obj):
        """Display total amount spent"""
        total = obj.get_total_spent()
        if total > 0:
            formatted_amount = f'{float(total):,.2f}'
            return format_html(
                '<strong style="color: blue;">${}</strong>',
                formatted_amount
            )
        return '$0.00'
    total_spent.short_description = 'إجمالي المشتريات'
    
    def last_purchase_date(self, obj):
        """Display last purchase date"""
        last_date = obj.get_last_purchase_date()
        if last_date:
            return format_html(
                '<span title="{}">{}</span>',
                last_date.strftime('%Y-%m-%d %H:%M'),
                last_date.strftime('%Y-%m-%d')
            )
        return 'لا يوجد'
    last_purchase_date.short_description = 'آخر شراء'
    
    actions = ['activate_customers', 'deactivate_customers']
    
    def activate_customers(self, request, queryset):
        """Activate selected customers"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'تم تفعيل {updated} عميل بنجاح.'
        )
    activate_customers.short_description = 'تفعيل العملاء المحددين'
    
    def deactivate_customers(self, request, queryset):
        """Deactivate selected customers"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'تم إلغاء تفعيل {updated} عميل بنجاح.'
        )
    deactivate_customers.short_description = 'إلغاء تفعيل العملاء المحددين'
    
    def save_model(self, request, obj, form, change):
        """Set created_by when saving through admin"""
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)