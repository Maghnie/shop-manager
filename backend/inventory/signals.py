from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Product, Inventory


@receiver(post_save, sender=Product)
def create_inventory_record(sender, instance, created, **kwargs):
    """Automatically create inventory record when product is created"""
    if created:
        Inventory.objects.get_or_create(product=instance)