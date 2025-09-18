from rest_framework import serializers


class TimeSeriesDataPointSerializer(serializers.Serializer):
    """Serializer for individual time series data points"""
    period = serializers.DateTimeField()
    revenue = serializers.FloatField()
    costs = serializers.FloatField() 
    profit = serializers.FloatField()
    sales_count = serializers.IntegerField()
    profit_margin = serializers.FloatField()

class TimeSeriesSummarySerializer(serializers.Serializer):
    """Serializer for time series summary statistics"""
    total_revenue = serializers.FloatField()
    total_costs = serializers.FloatField()
    total_profit = serializers.FloatField()
    total_sales = serializers.IntegerField()
    profit_margin = serializers.FloatField()
    average_sale_value = serializers.FloatField()

class TimeSeriesMetaSerializer(serializers.Serializer):
    """Serializer for time series metadata"""
    date_from = serializers.DateTimeField()
    date_to = serializers.DateTimeField()
    resolution = serializers.CharField()
    generated_at = serializers.DateTimeField()

class TimeSeriesResponseSerializer(serializers.Serializer):
    """Main serializer for time series analytics response"""
    data = TimeSeriesDataPointSerializer(many=True)
    summary = TimeSeriesSummarySerializer()
    meta = TimeSeriesMetaSerializer()

class ActualPerformanceSerializer(serializers.Serializer):
    """Serializer for actual product performance data"""
    quantity_sold = serializers.IntegerField()
    revenue = serializers.FloatField()
    cost = serializers.FloatField()
    profit = serializers.FloatField()

class BreakevenProductSerializer(serializers.Serializer):
    """Serializer for individual product breakeven analysis"""
    product_id = serializers.IntegerField()
    product_name_ar = serializers.CharField()
    type_name_ar = serializers.CharField()
    brand_name_ar = serializers.CharField()
    unit_price = serializers.FloatField()
    unit_cost = serializers.FloatField()
    unit_profit = serializers.FloatField()
    profit_margin = serializers.FloatField()
    breakeven_units = serializers.IntegerField()
    breakeven_revenue = serializers.FloatField()
    fixed_costs_allocated = serializers.FloatField()
    actual_performance = ActualPerformanceSerializer()
    performance_score = serializers.FloatField()
    status = serializers.CharField()
    available_stock = serializers.IntegerField()

class BreakevenSummarySerializer(serializers.Serializer):
    """Serializer for breakeven analysis summary"""
    total_products = serializers.IntegerField()
    high_performers = serializers.IntegerField()
    low_performers = serializers.IntegerField()
    total_fixed_costs = serializers.FloatField()
    total_revenue = serializers.FloatField()
    total_profit = serializers.FloatField()
    average_performance_score = serializers.FloatField()

class BreakevenMetaSerializer(serializers.Serializer):
    """Serializer for breakeven analysis metadata"""
    fixed_costs = serializers.FloatField()
    sort_by = serializers.CharField()
    sort_order = serializers.CharField()
    generated_at = serializers.DateTimeField()

class BreakevenResponseSerializer(serializers.Serializer):
    """Main serializer for breakeven analysis response"""
    products = BreakevenProductSerializer(many=True)
    summary = BreakevenSummarySerializer()
    meta = BreakevenMetaSerializer()

class AnalyticsExportSerializer(serializers.Serializer):
    """Serializer for export requests"""
    export_type = serializers.ChoiceField(choices=['timeseries', 'breakeven'])
    format = serializers.ChoiceField(choices=['csv', 'xlsx'])
    filename = serializers.CharField(max_length=255, required=False)
    # Time series specific fields
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    resolution = serializers.ChoiceField(
        choices=['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
        required=False
    )
    # Breakeven specific fields
    product_id = serializers.IntegerField(required=False)
    fixed_costs = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    sort_by = serializers.ChoiceField(
        choices=['performance', 'profit', 'revenue'],
        required=False,
        default='performance'
    )
    sort_order = serializers.ChoiceField(choices=['asc', 'desc'], required=False, default='desc')
