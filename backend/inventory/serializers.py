from rest_framework import serializers
from .models import Product, ProductType, Brand, Material

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
        # Set the user who created the product
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)