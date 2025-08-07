from django.contrib import admin
from .models import Product, ProductType, Brand, Material

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
        'type', 'brand', 'cost_price', 'selling_price', 
        'profit', 'profit_percentage', 'created_at'
    ]
    list_filter = ['type', 'brand', 'material', 'created_at']
    search_fields = ['type__name_ar', 'brand__name_ar', 'tags']
    readonly_fields = ['profit', 'profit_percentage', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def profit(self, obj):
        return f"${obj.profit:.2f}"
    profit.short_description = "الربح"
    
    def profit_percentage(self, obj):
        return f"{obj.profit_percentage:.1f}%"
    profit_percentage.short_description = "نسبة الربح"