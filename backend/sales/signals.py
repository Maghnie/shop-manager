from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Sale, Invoice


@receiver(post_save, sender=Sale)
def create_invoice_for_completed_sale(sender, instance, created, **kwargs):
    """
    Automatically create an invoice when a sale is marked as completed.
    This only happens if no invoice exists yet.
    """
    if instance.status == 'completed' and not hasattr(instance, 'invoice'):
        Invoice.objects.get_or_create(sale=instance)