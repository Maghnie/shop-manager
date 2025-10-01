from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Prefetch
from django.db.models.functions import Coalesce

from .models import Customer
from .serializers import (
    CustomerSerializer, 
    CustomerListSerializer, 
    CustomerCreateSerializer,
    CustomerQuickSerializer,
    CustomerStatsSerializer
)


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing customers"""
    
    queryset = Customer.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Filtering options
    filterset_fields = {
        'gender': ['exact'],
        'is_active': ['exact'],
        'is_placeholder': ['exact'],
        'created_at': ['gte', 'lte'],
    }
    
    # Search fields
    search_fields = ['name_ar', 'name_en', 'phone', 'email']
    
    # Ordering options
    ordering_fields = ['name_ar', 'created_at', 'updated_at']
    ordering = ['name_ar']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return CustomerListSerializer
        elif self.action == 'create':
            return CustomerCreateSerializer
        elif self.action == 'quick_list':
            return CustomerQuickSerializer
        return CustomerSerializer
    
    def get_queryset(self):
        """Optimize queryset based on action"""
        queryset = Customer.objects.select_related('created_by')
        
        if self.action == 'list':
            # Add purchase count annotation for list view
            queryset = queryset.annotate(
                _purchase_count=Count('sale', distinct=True)
            )
        elif self.action in ['retrieve', 'update', 'partial_update']:
            # Prefetch related sales for detail views
            from inventory.models import Sale
            queryset = queryset.prefetch_related(
                Prefetch('sale_set', queryset=Sale.objects.filter(status='completed'))
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def quick_list(self, request):
        """Get simplified customer list for dropdowns"""
        queryset = self.get_queryset().filter(is_active=True)
        
        # Optional filtering by gender
        gender = request.query_params.get('gender')
        if gender:
            queryset = queryset.filter(gender=gender)
        
        # Optional search
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name_ar__icontains=search) | 
                Q(name_en__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # Limit results for performance
        queryset = queryset[:50]
        
        serializer = CustomerQuickSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get customer statistics"""
        # Basic counts
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(is_active=True).count()
        male_customers = Customer.objects.filter(gender='male').count()
        female_customers = Customer.objects.filter(gender='female').count()
        
        # Customers with purchases
        customers_with_purchases = Customer.objects.filter(
            sales__status='completed'
        ).distinct().count()
        
        # Get customers and calculate totals in Python
        customers_with_sales = Customer.objects.filter(
            sales__status='completed'
        ).distinct()[:50]  # Limit for performance
        
        # Calculate spending for each customer
        customer_spending = []
        for customer in customers_with_sales:
            total_spent = customer.get_total_spent()
            if total_spent > 0:
                customer_spending.append((customer, float(total_spent)))
        
        # Sort by spending and take top 10
        customer_spending.sort(key=lambda x: x[1], reverse=True)
        top_customers = [customer for customer, _ in customer_spending[:10]]
        
        # Recent customers
        recent_customers = Customer.objects.filter(
            is_active=True
        ).order_by('-created_at')[:10]
        
        stats_data = {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'male_customers': male_customers,
            'female_customers': female_customers,
            'customers_with_purchases': customers_with_purchases,
            'top_customers': top_customers,
            'recent_customers': recent_customers,
        }
        
        serializer = CustomerStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        """Get customer's purchase history"""
        customer = self.get_object()
        from inventory.models import Sale
        from inventory.serializers import SaleListSerializer  # Assuming this exists
        
        sales = Sale.objects.filter(
            customer=customer,
            status='completed'
        ).select_related('created_by').prefetch_related('items__product')
        
        # Apply date filtering if provided
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            sales = sales.filter(sale_date__gte=date_from)
        if date_to:
            sales = sales.filter(sale_date__lte=date_to)
        
        # Pagination
        page = self.paginate_queryset(sales)
        if page is not None:
            serializer = SaleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = SaleListSerializer(sales, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def default_customers(self, request):
        """Get default placeholder customers"""
        male_customer = Customer.get_default_male_customer()
        female_customer = Customer.get_default_female_customer()
        
        serializer = CustomerQuickSerializer([male_customer, female_customer], many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle customer active status"""
        customer = self.get_object()
        customer.is_active = not customer.is_active
        customer.save()
        
        return Response({
            'status': 'success',
            'is_active': customer.is_active,
            'message': f'تم {"تفعيل" if customer.is_active else "إلغاء تفعيل"} العميل'
        })
    
    def perform_create(self, serializer):
        """Set created_by when creating customer"""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Custom delete logic with user-friendly messages"""
        instance = self.get_object()
        
        # Check if customer has any sales
        if instance.sales.exists():
            # Don't actually delete, just deactivate
            instance.is_active = False
            instance.save()
            return Response({
                'status': 'deactivated',
                'message': 'لا يمكن حذف عميل له مبيعات، تم إلغاء تفعيله بدلاً من ذلك'
            }, status=status.HTTP_200_OK)
        else:
            # Safe to delete
            instance.delete()
            return Response({
                'status': 'deleted',
                'message': 'تم حذف العميل بنجاح'
            }, status=status.HTTP_204_NO_CONTENT)