from django.db import models
from datetime import datetime, timedelta
from django.utils import timezone


class AnalyticsCache(models.Model):
    """Cache analytics results for performance optimization"""
    cache_key = models.CharField(max_length=255, unique=True, verbose_name="مفتاح التخزين المؤقت")
    data = models.JSONField(verbose_name="البيانات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    expires_at = models.DateTimeField(verbose_name="تاريخ انتهاء الصلاحية")
    
    class Meta:
        verbose_name = "تخزين مؤقت للتحليلات"
        verbose_name_plural = "التخزين المؤقت للتحليلات"
        indexes = [
            models.Index(fields=['cache_key']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Cache: {self.cache_key}"
    
    @property
    def is_expired(self):
        """Check if cache entry is expired"""
        return timezone.now() > self.expires_at
    
    def refresh_expiry(self, hours=24):
        """Refresh cache expiry time"""
        self.expires_at = timezone.now() + timedelta(hours=hours)
        self.save(update_fields=['expires_at'])