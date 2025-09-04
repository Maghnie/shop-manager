from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    """Full customer serializer with all fields"""
    
    # Read-only computed fields
    display_name = serializers.CharField(read_only=True)
    full_contact = serializers.CharField(read_only=True)
    total_purchases = serializers.SerializerMethodField()
    purchase_count = serializers.SerializerMethodField()
    last_purchase_date = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id',
            'name_ar',
            'name_en', 
            'phone',
            'email',
            'address',
            'gender',
            'birth_date',
            'notes',
            'is_placeholder',
            'is_active',
            'display_name',
            'full_contact',
            'total_spent',
            'purchase_count', 
            'last_purchase_date',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_total_spent(self, obj):
        """Get total amount spent"""
        try:
            return float(obj.get_total_spent())
        except:
            return 0.0
    
    def get_purchase_count(self, obj):
        """Get number of purchases"""
        try:
            return obj.get_purchase_count()
        except:
            return 0
    
    def get_last_purchase_date(self, obj):
        """Get last purchase date"""
        try:
            last_date = obj.get_last_purchase_date()
            return last_date.isoformat() if last_date else None
        except:
            return None
    
    def validate_phone(self, value):
        """Validate phone number format"""
        if value and len(value.strip()) < 3:
            raise serializers.ValidationError("رقم الهاتف قصير جداً")
        return value.strip() if value else value
    
    def validate(self, data):
        """Custom validation"""
        # Ensure at least one name is provided
        if not data.get('name_ar') and not data.get('name_en'):
            raise serializers.ValidationError({
                'name_ar': 'يجب توفير اسم العميل بالعربية على الأقل'
            })
        
        # Clean whitespace
        for field in ['name_ar', 'name_en', 'phone', 'email']:
            if data.get(field):
                data[field] = data[field].strip()
        
        return data


class CustomerListSerializer(serializers.ModelSerializer):
    """Simplified customer serializer for list views"""
    
    display_name = serializers.CharField(read_only=True)
    purchase_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            'id',
            'name_ar',
            'name_en',
            'phone',
            'gender',
            'display_name',
            'purchase_count',
            'is_active',
            'is_placeholder',
            'created_at',
        ]
    
    def get_purchase_count(self, obj):
        """Get purchase count efficiently"""
        # This will be optimized with prefetch_related in views
        return getattr(obj, '_purchase_count', obj.get_purchase_count())


class CustomerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new customers"""
    
    class Meta:
        model = Customer
        fields = [
            'name_ar',
            'name_en',
            'phone', 
            'email',
            'address',
            'gender',
            'birth_date',
            'notes',
        ]
    
    def validate(self, data):
        """Custom validation for creation"""
        # Ensure at least Arabic name is provided
        if not data.get('name_ar'):
            raise serializers.ValidationError({
                'name_ar': 'اسم العميل بالعربية مطلوب'
            })
        
        # Clean whitespace
        for field in ['name_ar', 'name_en', 'phone', 'email']:
            if data.get(field):
                data[field] = data[field].strip()
        
        return data
    
    def create(self, validated_data):
        """Create customer with current user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CustomerQuickSerializer(serializers.ModelSerializer):
    """Quick serializer for dropdowns and references"""
    
    display_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id',
            'name_ar', 
            'name_en',
            'display_name',
            'phone',
            'gender',
            'is_placeholder',
        ]


class CustomerStatsSerializer(serializers.Serializer):
    """Serializer for customer statistics"""
    
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    male_customers = serializers.IntegerField()
    female_customers = serializers.IntegerField()
    customers_with_purchases = serializers.IntegerField()
    top_customers = CustomerListSerializer(many=True)
    recent_customers = CustomerListSerializer(many=True)