# Generated migration file
from django.db import migrations, models
import django.db.models.deletion


def create_default_customers_and_assign_to_sales(apps, schema_editor):
    """Create default customers and assign default male customer to existing sales"""
    Customer = apps.get_model('customers', 'Customer')
    Sale = apps.get_model('inventory', 'Sale')
    User = apps.get_model('auth', 'User')
    
    # Get or create admin user (assuming first superuser)
    try:
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            # If no superuser, get first user or create one
            admin_user = User.objects.first()
            if not admin_user:
                admin_user = User.objects.create_user(
                    username='admin',
                    email='admin@example.com',
                    is_superuser=True,
                    is_staff=True
                )
    except Exception:
        # Fallback - create admin user
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            is_superuser=True,
            is_staff=True
        )
    
    # Create default male customer
    male_customer, created = Customer.objects.get_or_create(
        name_ar="فلان",
        is_placeholder=True,
        defaults={
            'name_en': 'John Doe',
            'gender': 'male',
            'created_by': admin_user,
        }
    )
    
    # Create default female customer
    female_customer, created = Customer.objects.get_or_create(
        name_ar="فلانة",
        is_placeholder=True,
        defaults={
            'name_en': 'Jane Doe', 
            'gender': 'female',
            'created_by': admin_user,
        }
    )
    
    # Assign default male customer to all existing sales
    Sale.objects.filter(customer__isnull=True).update(customer=male_customer)


def reverse_customer_assignment(apps, schema_editor):
    """Reverse the customer assignment"""
    Sale = apps.get_model('inventory', 'Sale')
    # Set all customers to null
    Sale.objects.update(customer=None)


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_inventory_sale_invoice_saleitem'),  # last migration
        ('customers', '0001_initial'),  # Customer app initial migration
    ]

    operations = [
        # Add customer field to Sale model
        migrations.AddField(
            model_name='sale',
            name='customer',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sales',
                to='customers.customer',
                verbose_name='العميل'
            ),
        ),
        
        # Run the data migration
        migrations.RunPython(
            create_default_customers_and_assign_to_sales,
            reverse_customer_assignment,
        ),
        
        # Set additional field properties for future clarity
        migrations.AlterField(
            model_name='sale',
            name='customer',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sales',
                to='customers.customer',
                verbose_name='العميل',
                help_text='العميل المرتبط بهذه البيعة'
            ),
        ),
    ]