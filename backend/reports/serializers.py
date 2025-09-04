from rest_framework import serializers
from .models import SalesReport


class SalesReportSerializer(serializers.ModelSerializer):
    """Serializer for SalesReport model"""
    
    period_display = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    
    class Meta:
        model = SalesReport
        fields = [
            'id',
            'resolution',
            'period_start',
            'period_end', 
            'period_display',
            'sales_count',
            'total_revenue',
            'total_cost',
            'total_profit',
            'average_sale_value',
            'profit_margin',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'total_profit',
            'average_sale_value',
            'profit_margin',
            'created_at',
            'updated_at'
        ]


class SalesReportSummarySerializer(serializers.Serializer):
    """Serializer for aggregated sales report data"""
    
    resolution = serializers.CharField()
    total_sales_count = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2)
    period_count = serializers.IntegerField()
    date_range = serializers.DictField()