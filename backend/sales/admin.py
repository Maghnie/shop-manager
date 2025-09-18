from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Sale, SaleItem, Invoice


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ('total_price', 'profit_per_item', 'total_profit', 'profit_percentage')
    fields = ('product', 'quantity', 'unit_price', 'total_price', 'profit_per_item', 'total_profit', 'profit_percentage')


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('sale_number', 'customer_display', 'sale_date', 'payment_method', 'status', 'final_total', 'net_profit', 'created_by')
    list_filter = ('status', 'payment_method', 'sale_date', 'created_by')
    search_fields = ('sale_number', 'customer_name', 'customer_phone', 'notes')
    readonly_fields = ('sale_number', 'subtotal', 'total_cost', 'gross_profit', 'discount_applied', 'tax_amount', 'final_total', 'net_profit', 'profit_percentage', 'created_at', 'updated_at')
    inlines = [SaleItemInline]

    fieldsets = (
        ('معلومات أساسية', {
            'fields': ('sale_number', 'sale_date', 'status', 'created_by')
        }),
        ('معلومات العميل', {
            'fields': ('customer', 'customer_name', 'customer_phone', 'customer_address')
        }),
        ('تفاصيل البيع', {
            'fields': ('payment_method', 'discount_amount', 'tax_percentage', 'notes')
        }),
        ('الحسابات', {
            'fields': ('subtotal', 'discount_applied', 'tax_amount', 'final_total', 'total_cost', 'gross_profit', 'net_profit', 'profit_percentage'),
            'classes': ('collapse',)
        }),
        ('معلومات النظام', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.status == 'completed':
            # If sale is completed, make most fields readonly
            return self.readonly_fields + ('customer', 'customer_name', 'customer_phone', 'customer_address',
                                           'payment_method', 'discount_amount', 'tax_percentage')
        return self.readonly_fields


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'get_customer_name', 'invoice_date', 'get_sale_total', 'is_printed', 'printed_at')
    list_filter = ('is_printed', 'invoice_date')
    search_fields = ('invoice_number', 'sale__customer_name', 'sale__sale_number')
    readonly_fields = ('invoice_number', 'created_at', 'updated_at', 'get_sale_link')

    fieldsets = (
        ('معلومات الفاتورة', {
            'fields': ('invoice_number', 'get_sale_link', 'invoice_date', 'due_date')
        }),
        ('معلومات الشركة', {
            'fields': ('company_name', 'company_address', 'company_phone', 'company_email')
        }),
        ('حالة الطباعة', {
            'fields': ('is_printed', 'printed_at')
        }),
        ('معلومات النظام', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_customer_name(self, obj):
        return obj.sale.customer_display
    get_customer_name.short_description = 'العميل'

    def get_sale_total(self, obj):
        return f"${obj.sale.final_total:.2f}"
    get_sale_total.short_description = 'المجموع'

    def get_sale_link(self, obj):
        if obj.sale:
            url = reverse('admin:sales_sale_change', args=[obj.sale.pk])
            return format_html('<a href="{}" target="_blank">بيعة #{}</a>', url, obj.sale.sale_number)
        return "-"
    get_sale_link.short_description = 'البيعة المرتبطة'