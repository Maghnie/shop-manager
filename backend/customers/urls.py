from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'customers', views.CustomerViewSet, basename='customer')

# URL patterns
urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]

# This will create the following endpoints:
# GET    /api/v1/customers/                    - List customers
# POST   /api/v1/customers/                    - Create customer
# GET    /api/v1/customers/{id}/               - Get customer details
# PUT    /api/v1/customers/{id}/               - Update customer
# PATCH  /api/v1/customers/{id}/               - Partial update customer
# DELETE /api/v1/customers/{id}/               - Delete customer
# GET    /api/v1/customers/quick_list/         - Get quick customer list
# GET    /api/v1/customers/statistics/         - Get customer statistics
# GET    /api/v1/customers/default_customers/  - Get default customers
# GET    /api/v1/customers/{id}/purchase_history/ - Get customer purchase history
# POST   /api/v1/customers/{id}/toggle_active/     - Toggle customer active status