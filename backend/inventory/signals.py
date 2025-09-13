from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Product, Sale, Inventory, Invoice
from reports.tasks import update_sales_reports_async


@receiver(post_save, sender=Product)
def create_inventory_record(sender, instance, created, **kwargs):
    """Automatically create inventory record when product is created"""
    if created:
        Inventory.objects.get_or_create(product=instance)


@receiver(post_save, sender=Sale)
def create_invoice_for_sale(sender, instance, created, **kwargs):
    """Automatically create invoice when sale is created"""
    if created and instance.status == 'completed':
        Invoice.objects.get_or_create(sale=instance, invoice_date=instance.sale_date)


@receiver(post_save, sender=Sale)
def handle_sale_reports_update(sender, instance, created, **kwargs):
    """Handle sale updates for reports - avoid circular import with lazy import"""
    if instance.status == 'completed':
        # Clear related cache
        cache.delete_many([
            'sales_stats_overview',
            'sales_stats_today',
            'sales_stats_week',
            'sales_stats_month'
        ])

        # update_sales_reports_async.delay(instance.id, created)