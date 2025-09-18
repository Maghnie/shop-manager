from decimal import Decimal

from rest_framework import serializers


class TimeSeriesMetricsQuerySerializer(serializers.Serializer):
    GROUP_CHOICES = (
        ('year', 'year'),
        ('month', 'month'),
        ('week', 'week'),
        ('day', 'day'),
        ('hour', 'hour'),
    )

    start_date = serializers.DateField(
        error_messages={
            'required': 'حقل تاريخ البداية مطلوب.',
            'invalid': 'صيغة تاريخ البداية غير صحيحة.'
        }
    )
    end_date = serializers.DateField(
        error_messages={
            'required': 'حقل تاريخ النهاية مطلوب.',
            'invalid': 'صيغة تاريخ النهاية غير صحيحة.'
        }
    )
    group_by = serializers.ChoiceField(
        choices=GROUP_CHOICES,
        default='month',
        required=False,
        error_messages={
            'invalid_choice': 'قيمة التجميع غير مدعومة.',
            'blank': 'قيمة التجميع مطلوبة.'
        }
    )
    page_size = serializers.IntegerField(
        min_value=1,
        max_value=500,
        required=False,
        allow_null=True,
        error_messages={
            'min_value': 'أقل حجم للصفحة هو 1.',
            'max_value': 'أقصى حجم للصفحة هو 500.',
            'invalid': 'قيمة حجم الصفحة غير صحيحة.'
        }
    )

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and start > end:
            raise serializers.ValidationError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.')
        return attrs


class ProductBreakEvenQuerySerializer(serializers.Serializer):
    ORDERING_FIELDS = {'period', 'revenue', 'units', 'profit', 'variance', 'cost', 'margin_ratio'}

    product_id = serializers.IntegerField(
        error_messages={
            'required': 'معرف المنتج مطلوب.',
            'invalid': 'معرف المنتج يجب أن يكون رقمًا.'
        }
    )
    start_date = serializers.DateField(
        required=False,
        allow_null=True,
        error_messages={'invalid': 'صيغة تاريخ البداية غير صحيحة.'}
    )
    end_date = serializers.DateField(
        required=False,
        allow_null=True,
        error_messages={'invalid': 'صيغة تاريخ النهاية غير صحيحة.'}
    )
    extra_unit_cost = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        default=Decimal('0'),
        min_value=Decimal('0'),
        error_messages={
            'invalid': 'قيمة التكلفة الإضافية غير صحيحة.',
            'min_value': 'التكلفة الإضافية يجب أن تكون رقمًا موجبًا أو صفرًا.'
        }
    )
    fixed_cost = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        default=Decimal('0'),
        min_value=Decimal('0'),
        error_messages={
            'invalid': 'قيمة التكاليف الثابتة غير صحيحة.',
            'min_value': 'التكاليف الثابتة يجب ألا تكون سالبة.'
        }
    )
    ordering = serializers.CharField(
        required=False,
        default='-profit',
        allow_blank=True,
        error_messages={'invalid': 'قيمة الترتيب غير صالحة.'}
    )
    page_size = serializers.IntegerField(
        min_value=1,
        max_value=500,
        required=False,
        allow_null=True,
        error_messages={
            'min_value': 'أقل حجم للصفحة هو 1.',
            'max_value': 'أقصى حجم للصفحة هو 500.',
            'invalid': 'قيمة حجم الصفحة غير صحيحة.'
        }
    )

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and start > end:
            raise serializers.ValidationError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.')

        ordering = attrs.get('ordering') or '-profit'
        field = ordering.lstrip('-')
        if field not in self.ORDERING_FIELDS:
            raise serializers.ValidationError({'ordering': 'قيمة الترتيب غير مدعومة.'})
        attrs['ordering'] = ordering
        return attrs
