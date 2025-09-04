from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Customer


@receiver(post_save, sender=Customer)
def customer_post_save(sender, instance, created, **kwargs):
    """Handle customer creation and updates"""
    
    # Clear cache when customer data changes
    cache_keys = [
        'customer_stats',
        f'customer_{instance.id}_purchases',
        'customer_list',
    ]
    
    for key in cache_keys:
        cache.delete(key)
    
    if created:
        # Log customer creation (you can integrate with your logging system)
        print(f"New customer created: {instance.name_ar} (ID: {instance.id})")


@receiver(pre_delete, sender=Customer)
def customer_pre_delete(sender, instance, **kwargs):
    """Handle customer deletion"""
    
    # Check if customer has sales
    if instance.sales.exists():
        # Log warning about deleting customer with sales
        print(f"Warning: Attempting to delete customer {instance.name_ar} who has sales")
    
    # Clear related cache
    cache_keys = [
        'customer_stats',
        f'customer_{instance.id}_purchases',
        'customer_list',
    ]
    
    for key in cache_keys:
        cache.delete(key)