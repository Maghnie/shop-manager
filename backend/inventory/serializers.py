from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from .models import Product, ProductType, Brand, Material, Sale, SaleItem, Invoice, Inventory


class ProductTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductType
        fields = ['id', 'name_en', 'name_ar', 'created_at']

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name_en', 'name_ar', 'created_at']

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name_en', 'name_ar', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    # Add computed fields for display
    type_name_ar = serializers.CharField(source='type.name_ar', read_only=True)
    type_name_en = serializers.CharField(source='type.name_en', read_only=True)
    brand_name_ar = serializers.CharField(source='brand.name_ar', read_only=True)
    brand_name_en = serializers.CharField(source='brand.name_en', read_only=True)
    material_name_ar = serializers.CharField(source='material.name_ar', read_only=True)
    material_name_en = serializers.CharField(source='material.name_en', read_only=True)
    
    # Include computed properties
    profit = serializers.ReadOnlyField()
    profit_percentage = serializers.ReadOnlyField()
    tags_list = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'type', 'cost_price', 'selling_price', 'brand', 'size', 
            'weight', 'material', 'tags', 'created_at', 'updated_at', 'created_by',
            # Computed fields
            'type_name_ar', 'type_name_en', 'brand_name_ar', 'brand_name_en',
            'material_name_ar', 'material_name_en', 'profit', 'profit_percentage', 'tags_list'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
        
    def create(self, validated_data):
        # Handle the user assignment for testing
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if request.user.is_authenticated:
                validated_data['created_by'] = request.user
            else:
                # For testing with anonymous users, get or create a default user
                default_user, created = User.objects.get_or_create(
                    username='test_user',
                    defaults={'email': 'test@example.com'}
                )
                validated_data['created_by'] = default_user
                
        return super().create(validated_data)

##################### Inventory and sales stuff 

class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.__str__', read_only=True)
    product_type = serializers.CharField(source='product.type.name_ar', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'product_name', 'product_type',
            'quantity_in_stock', 'minimum_stock_level', 'last_updated',
            'is_low_stock', 'is_out_of_stock'
        ]

class SaleItemSerializer(serializers.ModelSerializer):
    product_name_ar = serializers.CharField(source='product.type.name_ar', read_only=True)
    product_brand_ar = serializers.CharField(source='product.brand.name_ar', read_only=True)
    available_stock = serializers.IntegerField(source='product.inventory.quantity_in_stock', read_only=True)
    
    # Computed fields
    total_price = serializers.ReadOnlyField()
    profit_per_item = serializers.ReadOnlyField()
    total_profit = serializers.ReadOnlyField()
    profit_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'quantity', 'unit_price',
            'product_name_ar', 'product_brand_ar', 'available_stock',
            'total_price', 'profit_per_item', 'total_profit', 'profit_percentage'
        ]
    
    def validate(self, data):
        """Custom validation for sale items"""
        product = data['product']
        quantity = data['quantity']
        
        # Check stock availability
        if product.inventory.quantity_in_stock < quantity:
            raise serializers.ValidationError({
                'quantity': f'المخزون غير كافي. متوفر: {product.inventory.quantity_in_stock}'
            })
        
        return data

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    # Computed fields
    subtotal = serializers.ReadOnlyField()
    total_cost = serializers.ReadOnlyField()
    gross_profit = serializers.ReadOnlyField()
    discount_applied = serializers.ReadOnlyField()
    tax_amount = serializers.ReadOnlyField()
    final_total = serializers.ReadOnlyField()
    net_profit = serializers.ReadOnlyField()
    profit_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Sale
        fields = [
            'id', 'sale_number', 'sale_date', 'customer_name', 'customer_phone', 
            'customer_address', 'payment_method', 'status', 'discount_amount', 
            'tax_percentage', 'notes', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'items',
            # Computed fields
            'subtotal', 'total_cost', 'gross_profit', 'discount_applied',
            'tax_amount', 'final_total', 'net_profit', 'profit_percentage'
        ]
        read_only_fields = ['sale_number', 'created_by', 'created_at', 'updated_at']
    
    @transaction.atomic
    def create(self, validated_data):
        """Create sale with items"""
        items_data = validated_data.pop('items')
        
        # Set the user who created the sale
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if request.user.is_authenticated:
                validated_data['created_by'] = request.user
            else:
                # For testing with anonymous users
                default_user, created = User.objects.get_or_create(
                    username='test_user',
                    defaults={'email': 'test@example.com'}
                )
                validated_data['created_by'] = default_user
        
        # Create the sale
        sale = Sale.objects.create(**validated_data)
        
        # Create sale items
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        
        return sale
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Update sale and items"""
        items_data = validated_data.pop('items', None)
        
        # Update sale basic info
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            # For simplicity, we'll delete existing items and create new ones
            # In production, you might want more sophisticated updating
            existing_items = list(instance.items.all())
            
            # Restore stock for existing items before deleting
            for item in existing_items:
                item.product.inventory.quantity_in_stock += item.quantity
                item.product.inventory.save()
            
            # Delete existing items
            instance.items.all().delete()
            
            # Create new items
            for item_data in items_data:
                SaleItem.objects.create(sale=instance, **item_data)
        
        return instance

class SaleListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    
    # Key computed fields only
    final_total = serializers.ReadOnlyField()
    net_profit = serializers.ReadOnlyField()
    profit_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Sale
        fields = [
            'id', 'sale_number', 'sale_date', 'customer_name', 'payment_method',
            'status', 'created_by_name', 'items_count', 'final_total',
            'net_profit', 'profit_percentage'
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    sale_details = SaleSerializer(source='sale', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'sale', 'invoice_date', 'due_date',
            'company_name', 'company_address', 'company_phone', 'company_email',
            'is_printed', 'printed_at', 'created_at', 'updated_at', 'sale_details'
        ]
        read_only_fields = ['invoice_number', 'created_at', 'updated_at']

class InvoiceListSerializer(serializers.ModelSerializer):
    """Lighter serializer for invoice list views"""
    customer_name = serializers.CharField(source='sale.customer_name', read_only=True)
    final_total = serializers.DecimalField(source='sale.final_total', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'invoice_date', 'customer_name',
            'final_total', 'is_printed'
        ]