from django.urls import path

from .views import ProductBreakEvenView, TimeSeriesMetricsView

app_name = 'analytics'

urlpatterns = [
    path('time-series-metrics/', TimeSeriesMetricsView.as_view(), name='time-series-metrics'),
    path('product-break-even/', ProductBreakEvenView.as_view(), name='product-break-even'),
]
