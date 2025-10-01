from django.contrib import admin
from django.utils.html import format_html
from .models import Product, ProductType, Brand, Material, Inventory


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

class InventoryInline(admin.TabularInline):
    model = Inventory
    extra = 0
    fields = ('quantity_in_stock', 'minimum_stock_level', 'is_low_stock', 'is_out_of_stock')
    readonly_fields = ('is_low_stock', 'is_out_of_stock')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'type', 'brand', 'cost_price', 'selling_price', 'profit', 'profit_percentage', 'get_stock_level', 'created_by', 'created_at')
    list_filter = ('type', 'brand', 'material', 'created_at')
    search_fields = ('type__name_ar', 'brand__name_ar', 'size', 'tags')
    readonly_fields = ('profit', 'profit_percentage', 'tags_list', 'created_at', 'updated_at')
    inlines = [InventoryInline]

    fieldsets = (
        ('معلومات أساسية', {
            'fields': ('type', 'brand', 'material')
        }),
        ('أسعار', {
            'fields': ('cost_price', 'selling_price', 'profit', 'profit_percentage')
        }),
        ('تفاصيل إضافية', {
            'fields': ('size', 'weight', 'tags', 'tags_list'),
            'classes': ('collapse',)
        }),
        ('معلومات النظام', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_stock_level(self, obj):
        try:
            inventory = obj.inventory
            if inventory.is_out_of_stock:
                return format_html('<span style="color: red;">نفد المخزون</span>')
            elif inventory.is_low_stock:
                return format_html('<span style="color: orange;">{} قطعة (مخزون منخفض)</span>', inventory.quantity_in_stock)
            else:
                return format_html('<span style="color: green;">{} قطعة</span>', inventory.quantity_in_stock)
        except:
            return "غير محدد"
    get_stock_level.short_description = 'المخزون'

    def save_model(self, request, obj, form, change):
        if not change:  # Only set user on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity_in_stock', 'minimum_stock_level', 'is_low_stock', 'is_out_of_stock', 'last_updated')
    list_filter = ('last_updated', 'quantity_in_stock')
    search_fields = ('product__type__name_ar', 'product__brand__name_ar')
    readonly_fields = ('is_low_stock', 'is_out_of_stock', 'last_updated')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product', 'product__type', 'product__brand')