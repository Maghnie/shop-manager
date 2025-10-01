from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
# router = DefaultRouter()
# router.register(r'analytics', views.SaleViewSet)

urlpatterns = [
    path('time-series/', views.TimeSeriesAnalyticsView.as_view(), name='analytics-time-series'),
    path('breakeven/', views.BreakevenAnalysisView.as_view(), name='analytics-breakeven'),
    path('export/', views.AnalyticsExportView.as_view(), name='analytics-export'),

    # Router URLs
    # path('', include(router.urls)),
]