from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', obtain_auth_token, name='api_token_auth'),
    path('api/', include('inventory.urls')),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]