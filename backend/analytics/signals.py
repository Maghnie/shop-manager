from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from inventory.models import Product, Sale

from .cache import bump_cache_version


@receiver([post_save, post_delete], sender=Sale)
def sale_changed(sender, **kwargs):  # pragma: no cover - simple delegator
    bump_cache_version()


@receiver([post_save, post_delete], sender=Product)
def product_changed(sender, **kwargs):  # pragma: no cover - simple delegator
    bump_cache_version()
