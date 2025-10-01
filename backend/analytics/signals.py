from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .services import CacheService
from inventory.models import Product
from sales.models import Sale, SaleItem


@receiver([post_save, post_delete], sender=Sale)
def invalidate_analytics_cache_on_sale_change(sender, **kwargs):
    """Invalidate analytics cache when sales data changes"""
    CacheService.invalidate_analytics_cache()

@receiver([post_save, post_delete], sender=SaleItem) 
def invalidate_analytics_cache_on_sale_item_change(sender, **kwargs):
    """Invalidate analytics cache when sale items change"""
    CacheService.invalidate_analytics_cache()

@receiver([post_save, post_delete], sender=Product)
def invalidate_analytics_cache_on_product_change(sender, **kwargs):
    """Invalidate analytics cache when products change"""
    CacheService.invalidate_analytics_cache()