from django.contrib import admin
from .models import Product, ProductType, Brand, Material
from .models import Inventory
from .models import Sale, SaleItem, Invoice


@admin.register(ProductType)
class ProductTypeAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'created_at']
    search_fields = ['name_ar', 'name_en']
    ordering = ['name_ar']

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'created_at']
    search_fields = ['name_ar', 'name_en']
    ordering = ['name_ar']

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'created_at']
    search_fields = ['name_ar', 'name_en']
    ordering = ['name_ar']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'type', 'brand', 'cost_price', 'selling_price', 
        'profit', 'profit_percentage', 'created_at'
    ]
    list_filter = ['type', 'brand', 'material', 'created_at']
    search_fields = ['type__name_ar', 'brand__name_ar', 'tags']
    readonly_fields = ['profit', 'profit_percentage', 'created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        ('معلومات أساسية', {
            'fields': ('type', 'cost_price', 'selling_price')
        }),
        ('معلومات إضافية', {
            'fields': ('brand', 'size', 'weight', 'material', 'tags'),
            'classes': ('collapse',)
        }),
        ('معلومات النظام', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('الأرباح', {
            'fields': ('profit', 'profit_percentage'),
            'classes': ('collapse',)
        }),
    )
    def profit(self, obj):
        return f"${obj.profit:.2f}"
    profit.short_description = "الربح"
    
    def profit_percentage(self, obj):
        return f"{obj.profit_percentage:.1f}%"
    profit_percentage.short_description = "نسبة الربح"

    def save_model(self, request, obj, form, change):
        """Automatically set the created_by field to current user"""
        if not change:  # Only for new objects
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_readonly_fields(self, request, obj=None):
        """Make created_by readonly after creation"""
        readonly_fields = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly_fields.append('created_by')
        return readonly_fields
    
@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['sale_number', 'sale_date', 'final_total', 'created_at']
    search_fields = ['sale_number', 'sale_date']
    ordering = ['sale_date']