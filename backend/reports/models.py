from django.db import models
from django.utils import timezone
from decimal import Decimal


class SalesReport(models.Model):
    """
    Aggregated sales data across different time resolutions.
    Pre-computed for fast reporting and analytics.
    """
    RESOLUTION_CHOICES = [
        ('hourly', 'Hourly'),
        ('daily', 'Daily'), 
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    # Time period identification
    resolution = models.CharField(
        max_length=10, 
        choices=RESOLUTION_CHOICES,
        verbose_name="Resolution"
    )
    period_start = models.DateTimeField(
        verbose_name="Period Start",
        help_text="Start of the aggregation period"
    )
    period_end = models.DateTimeField(
        verbose_name="Period End", 
        help_text="End of the aggregation period"
    )
    
    # Sales metrics
    sales_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Sales Count",
        help_text="Number of completed sales in this period"
    )
    total_revenue = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        verbose_name="Total Revenue",
        help_text="Sum of final_total for all sales in this period"
    )
    total_cost = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        verbose_name="Total Cost",
        help_text="Sum of cost of goods sold for all sales in this period"
    )
    total_profit = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        verbose_name="Total Profit",
        help_text="Total revenue minus total cost"
    )
    
    # Additional useful metrics
    average_sale_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Average Sale Value",
        help_text="Average revenue per sale in this period"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-period_start', 'resolution']
        verbose_name = "Sales Report"
        verbose_name_plural = "Sales Reports"
        
        # Ensure unique periods per resolution
        unique_together = ['resolution', 'period_start']
        
        # Database indexes for fast queries
        indexes = [
            models.Index(fields=['resolution', 'period_start']),
            models.Index(fields=['resolution', '-period_start']),
            models.Index(fields=['period_start', 'period_end']),
        ]
    
    def __str__(self):
        return f"{self.get_resolution_display()} - {self.period_start.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def period_display(self):
        """Human-readable period description"""
        if self.resolution == 'hourly':
            return self.period_start.strftime('%Y-%m-%d %H:00')
        elif self.resolution == 'daily':
            return self.period_start.strftime('%Y-%m-%d')
        elif self.resolution == 'weekly':
            return f"Week of {self.period_start.strftime('%Y-%m-%d')}"
        elif self.resolution == 'monthly':
            return self.period_start.strftime('%Y-%m')
        elif self.resolution == 'yearly':
            return self.period_start.strftime('%Y')
        return str(self.period_start)
    
    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        if self.total_revenue > 0:
            return (self.total_profit / self.total_revenue) * 100
        return Decimal('0.00')
    
    def save(self, *args, **kwargs):
        """Auto-calculate derived fields before saving"""
        if self.sales_count > 0:
            self.average_sale_value = self.total_revenue / self.sales_count
        else:
            self.average_sale_value = Decimal('0.00')
            
        self.total_profit = self.total_revenue - self.total_cost
        super().save(*args, **kwargs)
