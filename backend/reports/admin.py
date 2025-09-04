from django.contrib import admin
from django.utils.html import format_html
from .models import SalesReport


@admin.register(SalesReport)
class SalesReportAdmin(admin.ModelAdmin):
    """Admin interface for SalesReport model"""
    
    list_display = [
        'period_display_formatted',
        'resolution',
        'sales_count',
        'total_revenue_formatted', 
        'total_profit_formatted',
        'profit_margin_formatted',
        'average_sale_value_formatted',
        'updated_at'
    ]
    
    list_filter = [
        'resolution',
        'period_start',
        'created_at'
    ]
    
    search_fields = [
        'resolution'
    ]
    
    readonly_fields = [
        'period_display',
        'total_profit',
        'average_sale_value', 
        'profit_margin',
        'created_at',
        'updated_at'
    ]
    
    fieldsets = (
        ('Period Information', {
            'fields': (
                'resolution',
                ('period_start', 'period_end'),
                'period_display'
            )
        }),
        ('Sales Metrics', {
            'fields': (
                'sales_count',
                ('total_revenue', 'total_cost'),
                'total_profit',
                'average_sale_value'
            )
        }),
        ('Analytics', {
            'fields': (
                'profit_margin',
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    date_hierarchy = 'period_start'
    ordering = ['-period_start', 'resolution']
    list_per_page = 50
    
    def period_display_formatted(self, obj):
        """Display formatted period with resolution badge"""
        resolution_colors = {
            'hourly': '#17a2b8',    # info blue
            'daily': '#28a745',     # success green  
            'weekly': '#ffc107',    # warning yellow
            'monthly': '#fd7e14',   # orange
            'yearly': '#6f42c1'     # purple
        }
        color = resolution_colors.get(obj.resolution, '#6c757d')
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 8px;">{}</span>{}',
            color,
            obj.get_resolution_display(),
            obj.period_display
        )
    period_display_formatted.short_description = 'Period'
    period_display_formatted.admin_order_field = 'period_start'
    
    def total_revenue_formatted(self, obj):
        """Display formatted revenue"""
        if obj.total_revenue > 0:
            formatted_amount = f'{float(obj.total_revenue):,.2f}'
            return format_html(
                '<strong style="color: #28a745;">${}</strong>',
                formatted_amount
            )
        return '$0.00'
    total_revenue_formatted.short_description = 'Revenue'
    total_revenue_formatted.admin_order_field = 'total_revenue'
    
    def total_profit_formatted(self, obj):
        """Display formatted profit with color coding"""
        profit = float(obj.total_profit)
        if profit > 0:
            color = '#28a745'  # green
        elif profit < 0:
            color = '#dc3545'  # red
        else:
            color = '#6c757d'  # gray

        formatted_amount = f'{profit:,.2f}'    
        return format_html(
            '<strong style="color: {};">${}</strong>',
            color,
            formatted_amount
        )
    total_profit_formatted.short_description = 'Profit'
    total_profit_formatted.admin_order_field = 'total_profit'
    
    def profit_margin_formatted(self, obj):
        """Display formatted profit margin percentage"""
        margin = float(obj.profit_margin)
        if margin > 20:
            color = '#28a745'  # green
        elif margin > 10:
            color = '#ffc107'  # yellow
        elif margin > 0:
            color = '#fd7e14'  # orange
        else:
            color = '#dc3545'  # red
        
        formatted_amount = f'{margin:.1f}'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color,
            formatted_amount
        )
    profit_margin_formatted.short_description = 'Margin'
    
    def average_sale_value_formatted(self, obj):
        """Display formatted average sale value"""
        formatted_amount = f'{float(obj.average_sale_value):,.2f}'
        return format_html(
            '<span style="color: #17a2b8;">${}</span>',
            formatted_amount
        )
    average_sale_value_formatted.short_description = 'Avg Sale'
    average_sale_value_formatted.admin_order_field = 'average_sale_value'
    
    actions = ['recalculate_metrics']
    
    def recalculate_metrics(self, request, queryset):
        """Recalculate derived metrics for selected reports"""
        updated = 0
        for report in queryset:
            report.save()  # This triggers the auto-calculation in save()
            updated += 1
            
        self.message_user(
            request,
            f'Successfully recalculated metrics for {updated} sales reports.'
        )
    recalculate_metrics.short_description = 'Recalculate metrics for selected reports'
