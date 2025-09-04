from django.urls import path
# from .views import ReportsView
from . import views

urlpatterns = [
    path('', views.ReportsView.as_view(), name='reports-list'),
    # Original summary view
    path('summary/', views.ReportsView.as_view(), name='reports-summary'),
    
    # Basic views (fixed limit of 10)
    path('top-products/profit-usd/', views.TopProductsByProfitUSDView.as_view(), name='top-products-profit-usd'),
    path('top-products/profit-percentage/', views.TopProductsByProfitPercentageView.as_view(), name='top-products-profit-percentage'),
    path('bottom-products/profit-usd/', views.BottomProductsByProfitUSDView.as_view(), name='bottom-products-profit-usd'),
    path('bottom-products/profit-percentage/', views.BottomProductsByProfitPercentageView.as_view(), name='bottom-products-profit-percentage'),
    
    # Enhanced views (configurable limit with validation)
    path('enhanced/top-products/profit-usd/', views.EnhancedTopProductsByProfitUSDView.as_view(), name='enhanced-top-products-profit-usd'),
    path('enhanced/top-products/profit-percentage/', views.EnhancedTopProductsByProfitPercentageView.as_view(), name='enhanced-top-products-profit-percentage'),
    path('enhanced/bottom-products/profit-usd/', views.EnhancedBottomProductsByProfitUSDView.as_view(), name='enhanced-bottom-products-profit-usd'),
    path('enhanced/bottom-products/profit-percentage/', views.EnhancedBottomProductsByProfitPercentageView.as_view(), name='enhanced-bottom-products-profit-percentage'),
    
    # Sales Report endpoints
    path('sales-reports/', views.SalesReportListView.as_view(), name='sales-reports-list'),
    path('sales-reports/<int:pk>/', views.SalesReportDetailView.as_view(), name='sales-reports-detail'),
    path('sales-reports/summary/', views.SalesReportSummaryView.as_view(), name='sales-reports-summary'),
    path('sales-reports/trends/', views.SalesReportTrendsView.as_view(), name='sales-reports-trends'),
]
