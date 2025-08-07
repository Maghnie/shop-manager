
from rest_framework import serializers
from .models import Product, ProductType, Brand, Material
from typing import Dict, Any

class ProductTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductType
        fields = ['id', 'name_en', 'name_ar']

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name_en', 'name_ar']

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name_en', 'name_ar']

class ProductSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source='type.name_ar', read_only=True)
    brand_name = serializers.CharField(source='brand.name_ar', read_only=True)
    material_name = serializers.CharField(source='material.name_ar', read_only=True)
    profit = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    profit_percentage = serializers.FloatField(read_only=True)
    tags_list = serializers.ListField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'type', 'type_name', 'brand', 'brand_name', 
            'cost_price', 'selling_price', 'profit', 'profit_percentage',
            'size', 'weight', 'material', 'material_name', 'tags', 'tags_list',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that selling price is greater than cost price"""
        cost_price = data.get('cost_price')
        selling_price = data.get('selling_price')
        
        if cost_price and selling_price and selling_price <= cost_price:
            raise serializers.ValidationError(
                "سعر البيع يجب أن يكون أكبر من سعر التكلفة"
            )
        
        return data
    
    def create(self, validated_data: Dict[str, Any]) -> Product:
        """Create product with current user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

