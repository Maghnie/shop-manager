from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from rest_framework.authtoken.views import obtain_auth_token
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.urls import reverse
# from django.conf.urls import url
import re

@api_view(['GET'])
def api_root(request, format=None):
    """
    API root endpoint that dynamically lists all available v1 endpoints
    """
    # Get the current request's scheme and host
    base_url = request.build_absolute_uri('/').rstrip('/')
    
    # Build endpoints dynamically based on URL patterns
    endpoints = {
        'version': 'v1',
        'endpoints': {
            'inventory': f"{base_url}/api/v1/inventory/",
            'reports': f"{base_url}/api/v1/reports/",
            'users': f"{base_url}/api/v1/users/",
            'auth': {
                'token': f"{base_url}/api/v1/auth/token/",
                'login': f"{base_url}/api-auth/login/",
                'logout': f"{base_url}/api-auth/logout/",
            }
        },
        'documentation': f"{base_url}/api/v1/docs/",  # For future API docs
    }
    
    return Response(endpoints)

def home_view(request):
    """Simple home page that doesn't require templates"""
    return JsonResponse({
        'message': 'نظام إدارة المخزون',
        'status': 'running',
        'api_version': 'v1',
        'api_root': '/api/v1/',
        'admin': '/admin/',
        'version': '1.0'
    })

# API v1 URL patterns - centralized for easy management
api_v1_patterns = [
    path('', api_root, name='api-v1-root'),    
    # Functional app groupings
    path('inventory/', include('inventory.urls')),
    path('reports/', include('reports.urls')),
    path('users/', include('users.urls')),
    
    # Authentication endpoints
    path('auth/token/', obtain_auth_token, name='api_v1_token_auth'),
    # path('auth/', include('dj_rest_auth.urls')), # login, logout, password reset
    # path('auth/registration/', include('dj_rest_auth.registration.urls')), # register
]

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1 - all API endpoints under versioned namespace
    path('api/v1/', include(api_v1_patterns)),
    
    # DRF browseable API auth (not versioned as it's UI)
    path('api-auth/', include('rest_framework.urls')),
    
    # Convenience redirect from /api/ to current version
    path('api/', api_root, name='api-root-redirect'),
    
    # Home page
    path('', home_view, name='home'),
]