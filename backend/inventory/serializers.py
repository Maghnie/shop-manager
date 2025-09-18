from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, ProductType, Brand, Material, Inventory


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
    # Computed fields for display
    type_name_ar = serializers.CharField(source='type.name_ar', read_only=True)
    type_name_en = serializers.CharField(source='type.name_en', read_only=True)
    brand_name_ar = serializers.CharField(source='brand.name_ar', read_only=True)
    brand_name_en = serializers.CharField(source='brand.name_en', read_only=True)
    material_name_ar = serializers.CharField(source='material.name_ar', read_only=True)
    material_name_en = serializers.CharField(source='material.name_en', read_only=True)
    
    # Computed properties
    profit = serializers.ReadOnlyField()
    profit_percentage = serializers.ReadOnlyField()
    tags_list = serializers.ReadOnlyField()

    # Inventory data
    available_stock = serializers.IntegerField(source='inventory.quantity_in_stock', read_only=True)
    is_low_stock = serializers.BooleanField(source='inventory.is_low_stock', read_only=True)
    
    
    class Meta:
        model = Product
        fields = [
            'id', 'type', 'cost_price', 'selling_price', 'brand', 'size', 
            'weight', 'material', 'tags', 'created_at', 'updated_at', 'created_by',
            'is_active',
            # Computed fields
            'type_name_ar', 'type_name_en', 'brand_name_ar', 'brand_name_en',
            'material_name_ar', 'material_name_en', 'profit', 'profit_percentage', 'tags_list',
            # Inventory fields
            'available_stock', 'is_low_stock',
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