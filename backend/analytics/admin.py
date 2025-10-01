from django.contrib import admin
from django.utils import timezone
from .models import AnalyticsCache


@admin.register(AnalyticsCache)
class AnalyticsCacheAdmin(admin.ModelAdmin):
    list_display = ('cache_key', 'created_at', 'expires_at', 'is_expired')
    list_filter = ('created_at', 'expires_at')
    search_fields = ('cache_key',)
    readonly_fields = ('created_at',)
    
    def is_expired(self, obj):
        return obj.is_expired
    is_expired.boolean = True
    is_expired.short_description = 'منتهي الصلاحية'
    
    actions = ['clear_expired_cache']
    
    def clear_expired_cache(self, request, queryset):
        expired_count = queryset.filter(expires_at__lt=timezone.now()).count()
        queryset.filter(expires_at__lt=timezone.now()).delete()
        self.message_user(request, f'تم حذف {expired_count} عنصر منتهي الصلاحية')
    clear_expired_cache.short_description = 'حذف العناصر منتهية الصلاحية'