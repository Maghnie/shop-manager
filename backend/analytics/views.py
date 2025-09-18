
from datetime import datetime, timedelta
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny

from .services import TimeSeriesService, BreakevenService, ExportService, CacheService
from .serializers import (
    TimeSeriesResponseSerializer, BreakevenResponseSerializer, AnalyticsExportSerializer
)
from inventory.models import Product

class TimeSeriesAnalyticsView(APIView):
    """
    API endpoint for time series analytics
    
    GET /api/v1/analytics/time-series/
    
    Query Parameters:
    - date_from: Start date (ISO format)
    - date_to: End date (ISO format)  
    - resolution: Time resolution (hourly, daily, weekly, monthly, yearly)
    """
    permission_classes = [AllowAny]  # FIXME: Change to proper permissions
    
    def get(self, request):
        # Parse query parameters
        try:
            date_from_str = request.GET.get('date_from')
            date_to_str = request.GET.get('date_to')
            resolution = request.GET.get('resolution', 'daily')
            
            # Validate resolution
            valid_resolutions = ['hourly', 'daily', 'weekly', 'monthly', 'yearly']
            if resolution not in valid_resolutions:
                return Response({
                    'error': f'دقة زمنية غير صحيحة. يجب أن تكون إحدى: {", ".join(valid_resolutions)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse dates
            if date_from_str:
                date_from = datetime.fromisoformat(date_from_str.replace('Z', '+00:00'))
            else:
                # Default to 30 days ago
                date_from = timezone.now() - timedelta(days=30)
            
            if date_to_str:
                date_to = datetime.fromisoformat(date_to_str.replace('Z', '+00:00'))
            else:
                # Default to now
                date_to = timezone.now()
            
            # Validate date range
            if date_from >= date_to:
                return Response({
                    'error': 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for reasonable date range limits
            max_days = {
                'hourly': 7,    # Max 7 days for hourly data
                'daily': 365,   # Max 1 year for daily data
                'weekly': 730,  # Max 2 years for weekly data
                'monthly': 1825, # Max 5 years for monthly data
                'yearly': 3650   # Max 10 years for yearly data
            }
            
            days_diff = (date_to - date_from).days
            if days_diff > max_days.get(resolution, 365):
                return Response({
                    'error': f'نطاق التاريخ كبير جداً للدقة المطلوبة. الحد الأقصى {max_days.get(resolution)} يوم'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get time series data
            data = TimeSeriesService.get_time_series_data(
                date_from=date_from,
                date_to=date_to,
                resolution=resolution
            )
            
            # Serialize response
            serializer = TimeSeriesResponseSerializer(data)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({
                'error': f'خطأ في تنسيق التاريخ: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({
                'error': f'حدث خطأ في الخادم: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BreakevenAnalysisView(APIView):
    """
    API endpoint for breakeven analysis
    
    GET /api/v1/analytics/breakeven/
    
    Query Parameters:
    - product_id: Specific product ID (optional, if not provided returns all products)
    - fixed_costs: Fixed costs amount (default: 0)
    - sort_by: Sort field (performance, profit, revenue) 
    - sort_order: Sort direction (asc, desc)
    """
    permission_classes = [AllowAny]  # FIXME: Change to proper permissions
    
    def get(self, request):
        try:
            # Parse query parameters
            product_id_str = request.GET.get('product_id')
            fixed_costs_str = request.GET.get('fixed_costs', '0')
            sort_by = request.GET.get('sort_by', 'performance')
            sort_order = request.GET.get('sort_order', 'desc')
            
            # Validate parameters
            product_id = None
            if product_id_str:
                try:
                    product_id = int(product_id_str)
                    # Verify product exists
                    if not Product.objects.filter(id=product_id).exists():
                        return Response({
                            'error': 'المنتج المحدد غير موجود'
                        }, status=status.HTTP_404_NOT_FOUND)
                except ValueError:
                    return Response({
                        'error': 'معرف المنتج يجب أن يكون رقماً صحيحاً'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            import decimal
            from decimal import Decimal
            try:                
                fixed_costs = Decimal(fixed_costs_str)
                if fixed_costs < 0:
                    return Response({
                        'error': 'التكاليف الثابتة يجب أن تكون أكبر من أو تساوي الصفر'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, decimal.InvalidOperation):
                return Response({
                    'error': 'التكاليف الثابتة يجب أن تكون رقماً صحيحاً'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate sort parameters
            valid_sort_by = ['performance', 'profit', 'revenue']
            valid_sort_order = ['asc', 'desc']
            
            if sort_by not in valid_sort_by:
                return Response({
                    'error': f'حقل الترتيب غير صحيح. يجب أن يكون إحدى: {", ".join(valid_sort_by)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if sort_order not in valid_sort_order:
                return Response({
                    'error': f'اتجاه الترتيب غير صحيح. يجب أن يكون إحدى: {", ".join(valid_sort_order)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get breakeven analysis data
            data = BreakevenService.get_breakeven_analysis(
                product_id=product_id,
                fixed_costs=fixed_costs,
                sort_by=sort_by,
                sort_order=sort_order
            )
            
            # Serialize response
            serializer = BreakevenResponseSerializer(data)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'حدث خطأ في الخادم: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnalyticsExportView(APIView):
    """
    API endpoint for exporting analytics data
    
    POST /api/v1/analytics/export/
    
    Request Body:
    {
        "export_type": "timeseries|breakeven",
        "format": "csv|xlsx", 
        "filename": "optional_filename",
        // For timeseries:
        "date_from": "ISO date",
        "date_to": "ISO date",
        "resolution": "daily|weekly|monthly",
        // For breakeven:
        "product_id": 123,
        "fixed_costs": 1000.00,
        "sort_by": "performance|profit|revenue",
        "sort_order": "asc|desc"
    }
    """
    permission_classes = [AllowAny]  # FIXME: Change to proper permissions
    
    def post(self, request):
        try:
            # Validate request data
            serializer = AnalyticsExportSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'error': 'بيانات الطلب غير صحيحة',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            export_type = validated_data['export_type']
            file_format = validated_data['format']
            
            # Generate data based on export type
            if export_type == 'timeseries':
                # Get time series data
                date_from = validated_data.get('date_from') or (timezone.now() - timedelta(days=30))
                date_to = validated_data.get('date_to') or timezone.now()
                resolution = validated_data.get('resolution', 'daily')
                
                analytics_data = TimeSeriesService.get_time_series_data(
                    date_from=date_from,
                    date_to=date_to,
                    resolution=resolution
                )
                
                export_data = analytics_data['data']
                default_filename = f"time_series_{resolution}_{date_from.strftime('%Y%m%d')}_{date_to.strftime('%Y%m%d')}"
                
            elif export_type == 'breakeven':
                # Get breakeven data
                product_id = validated_data.get('product_id')
                fixed_costs = validated_data.get('fixed_costs', 0)
                sort_by = validated_data.get('sort_by', 'performance')
                sort_order = validated_data.get('sort_order', 'desc')
                
                analytics_data = BreakevenService.get_breakeven_analysis(
                    product_id=product_id,
                    fixed_costs=fixed_costs,
                    sort_by=sort_by,
                    sort_order=sort_order
                )
                
                export_data = analytics_data['products']
                default_filename = f"breakeven_analysis_{timezone.now().strftime('%Y%m%d')}"
                
            else:
                return Response({
                    'error': 'نوع التصدير غير مدعوم'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate filename
            filename = validated_data.get('filename') or default_filename
            if not filename.endswith(f'.{file_format}'):
                filename += f'.{file_format}'
            
            # Generate file content
            if file_format == 'csv':
                content = ExportService.export_to_csv(export_data, filename)
                content_type = 'text/csv'
                content_bytes = content.encode('utf-8-sig')  # UTF-8 with BOM for Arabic support
                
            elif file_format == 'xlsx':
                content_bytes = ExportService.export_to_xlsx(export_data, filename)
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                
            else:
                return Response({
                    'error': 'تنسيق الملف غير مدعوم'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Return file as HTTP response
            response = HttpResponse(content_bytes, content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            
            return response
            
        except Exception as e:
            return Response({
                'error': f'حدث خطأ أثناء التصدير: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
