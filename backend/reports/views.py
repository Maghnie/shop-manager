# reports/views.py
from decimal import Decimal
from django.db.models import Avg, Max, Min, F, Case, When, Value, FloatField, Sum, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import AllowAny  # FIXME
from django.core.exceptions import FieldError
from datetime import datetime, timedelta
from django.utils import timezone
from django.utils.dateparse import parse_datetime, parse_date

from inventory.models import Product
from .models import SalesReport
from .serializers import SalesReportSerializer, SalesReportSummarySerializer


class ReportsView(APIView): #TODO make report calculations optimized 
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        qs = Product.objects.all()
        total_products = qs.count()

        # Try DB-side aggregation (fast) if profit fields actually exist
        try:
            agg = qs.aggregate(     
                # min_profit_usd=min('profit'),           
                max_profit_usd=Max('profit'),                
                avg_profit_usd=Avg('profit'),                
                # min_profit_pct=min('profit_percentage'),
                max_profit_pct=Max('profit_percentage'),
                avg_profit_pct=Avg('profit_percentage'),
                                
            )

            def to_num(x):
                return float(x) if x is not None else 0.0

            data = {
                "total_products": total_products,
                "summary": {
                    "min_profit_usd": round(to_num(agg.get('min_profit_usd')), 2),
                    "max_profit_usd": round(to_num(agg.get('max_profit_usd')), 2),
                    "avg_profit_usd": round(to_num(agg.get('avg_profit_usd')), 2),
                    "min_profit_pct": round(to_num(agg.get('min_profit_pct')), 2),
                    "max_profit_pct": round(to_num(agg.get('max_profit_pct')), 2),
                    "avg_profit_pct": round(to_num(agg.get('avg_profit_pct')), 2),
                    
                },
            }
            return Response(data, status=status.HTTP_200_OK)

        except (FieldError, Exception): # TODO confirm this is not needed
            
            # Fallback: compute manually from cost_price & selling_price
            # This handles the case where profit fields are not actual model fields.
            total_profit = 0.0
            total_pct = 0.0
            pct_count = 0
            max_profit = float('-inf')
            min_profit = float('inf')

            for p in qs:
                cost = float(p.cost_price) if getattr(p, 'cost_price', None) is not None else 0.0
                sell = float(p.selling_price) if getattr(p, 'selling_price', None) is not None else 0.0
                profit = sell - cost
                total_profit += profit
                if cost > 0:
                    total_pct += (profit / cost) * 100
                    pct_count += 1
                if profit > max_profit:
                    max_profit = profit
                if profit < min_profit:
                    min_profit = profit

            if total_products == 0:
                avg_profit = 0.0
            else:
                avg_profit = total_profit / total_products

            avg_pct = (total_pct / pct_count) if pct_count else 0.0
            max_profit = max_profit if max_profit != float('-inf') else 0.0
            min_profit = min_profit if min_profit != float('inf') else 0.0

            data = {
                "total_products": total_products,
                "summary": {
                    "avg_profit_usd": round(avg_profit, 2),
                    "avg_profit_pct": round(avg_pct, 2),
                    "max_profit_usd": round(max_profit, 2),
                    "min_profit_usd": round(min_profit, 2),
                },
            }
            return Response(data, status=status.HTTP_200_OK)


class TopProductsByProfitUSDView(APIView):
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        # Get limit from query parameter, default to 10, max 100
        limit = request.query_params.get('limit', 10)
        try:
            limit = int(limit)
            if limit <= 0:
                limit = 10
            elif limit > 100:  # Set reasonable max limit
                limit = 100
        except (ValueError, TypeError):
            limit = 10

        total_products = Product.objects.count()
        # Ensure we don't try to get more products than exist
        limit = min(limit, total_products)

        try:
            # Try using profit field if it exists
            top_products = Product.objects.order_by('-profit')[:limit]
            
            products_data = []
            for product in top_products:
                products_data.append({
                    'id': product.id,
                    'type': product.type.name_ar,
                    'brand': product.brand.name_ar,
                    'profit_usd': round(float(product.profit), 2) if product.profit else 0.0,
                    'cost_price': round(float(product.cost_price), 2) if product.cost_price else 0.0,
                    'selling_price': round(float(product.selling_price), 2) if product.selling_price else 0.0,
                })

        except (FieldError, AttributeError):
            # Fallback: calculate profit manually
            products = Product.objects.all()
            products_with_profit = []
            
            for product in products:
                cost = float(product.cost_price) if getattr(product, 'cost_price', None) is not None else 0.0
                sell = float(product.selling_price) if getattr(product, 'selling_price', None) is not None else 0.0
                profit = sell - cost
                
                products_with_profit.append({
                    'id': product.id,
                    'type': product.type.name_ar,
                    'brand': product.brand.name_ar,
                    'profit_usd': round(profit, 2),
                    'cost_price': round(cost, 2),
                    'selling_price': round(sell, 2),
                    'calculated_profit': profit
                })
            
            # Sort by profit and take top N
            products_with_profit.sort(key=lambda x: x['calculated_profit'], reverse=True)
            products_data = products_with_profit[:limit]
            
            # Remove the helper field
            for product in products_data:
                del product['calculated_profit']

        data = {
            # "total_products": total_products,
            # "limit": limit,
            "top_products_by_profit_usd": products_data
        }
        return Response(data, status=status.HTTP_200_OK)


class TopProductsByProfitPercentageView(APIView):
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        # Get limit from query parameter, default to 10, max 100
        limit = request.query_params.get('limit', 10)
        try:
            limit = int(limit)
            if limit <= 0:
                limit = 10
            elif limit > 100:
                limit = 100
        except (ValueError, TypeError):
            limit = 10

        total_products = Product.objects.count()
        limit = min(limit, total_products)

        try:
            # Try using profit_percentage field if it exists
            top_products = Product.objects.order_by('-profit_percentage')[:limit]
            
            products_data = []
            for product in top_products:
                products_data.append({
                    'id': product.id,
                    'type': product.type.name_ar,
                    'brand': product.brand.name_ar,
                    'profit_percentage': round(float(product.profit_percentage), 2) if product.profit_percentage else 0.0,
                    'cost_price': round(float(product.cost_price), 2) if product.cost_price else 0.0,
                    'selling_price': round(float(product.selling_price), 2) if product.selling_price else 0.0,
                })

        except (FieldError, AttributeError):
            # Fallback: calculate profit percentage manually
            products = Product.objects.all()
            products_with_profit_pct = []
            
            for product in products:
                cost = float(product.cost_price) if getattr(product, 'cost_price', None) is not None else 0.0
                sell = float(product.selling_price) if getattr(product, 'selling_price', None) is not None else 0.0
                
                # Calculate profit percentage: (selling_price - cost_price) / cost_price * 100
                if cost > 0:
                    profit_pct = ((sell - cost) / cost) * 100
                else:
                    profit_pct = 0.0  # Avoid division by zero
                
                products_with_profit_pct.append({
                    'id': product.id,
                    'type': product.type.name_ar,
                    'brand': product.brand.name_ar,
                    'profit_percentage': round(profit_pct, 2),
                    'cost_price': round(cost, 2),
                    'selling_price': round(sell, 2),
                    'calculated_profit_pct': profit_pct
                })
            
            # Sort by profit percentage ascending and take bottom N
            # products_with_profit_pct.sort(key=lambda x: x['calculated_profit_pct'])
            # products_data = products_with_profit_pct[:actual_limit]
            
            # # Remove the helper field
            # for product in products_data:
            #     del product['calculated_profit_pct']

        # response_data = {
        #     "total_products": total_products,
        #     "requested_limit": limit,
        #     "actual_limit": actual_limit,
        #     "bottom_products_by_profit_percentage": products_data
        # }
        
        # # Add warning if requested limit was adjusted
        # if actual_limit < limit:
        #     response_data["warning"] = f"Only {total_products} products available. Showing all products."

        # return Response(response_data, status=status.HTTP_200_OK)_
            
            # Sort by profit percentage and take top N
            products_with_profit_pct.sort(key=lambda x: x['calculated_profit_pct'], reverse=True)
            products_data = products_with_profit_pct[:limit]
            
            # Remove the helper field
            for product in products_data:
                del product['calculated_profit_pct']

            data = {
                # "total_products": total_products,
                # "limit": limit,
                "top_products_by_profit_percentage": products_data
            }
            return Response(data, status=status.HTTP_200_OK)


class BottomProductsByProfitUSDView(APIView):
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        # Get limit from query parameter, default to 10, max 100
        limit = request.query_params.get('limit', 10)
        try:
            limit = int(limit)
            if limit <= 0:
                limit = 10
            elif limit > 100:
                limit = 100
        except (ValueError, TypeError):
            limit = 10

        total_products = Product.objects.count()
        limit = min(limit, total_products)

        try:
            # Try using profit field if it exists (ascending order for bottom)
            bottom_products = Product.objects.order_by('profit')[:limit]
            
            products_data = []
            for product in bottom_products:
                products_data.append({
                    'id': product.id,
                    'type': product.type.name_ar,
                    'brand': product.brand.name_ar,
                    'profit_usd': round(float(product.profit), 2) if product.profit else 0.0,
                    'cost_price': round(float(product.cost_price), 2) if product.cost_price else 0.0,
                    'selling_price': round(float(product.selling_price), 2) if product.selling_price else 0.0,
                })

        except (FieldError, AttributeError):
            # Fallback: calculate profit manually
            products = Product.objects.all()
            products_with_profit = []
            
            for product in products:
                cost = float(product.cost_price) if getattr(product, 'cost_price', None) is not None else 0.0
                sell = float(product.selling_price) if getattr(product, 'selling_price', None) is not None else 0.0
                profit = sell - cost
                
                products_with_profit.append({
                    'id': product.id,
                    'type': product.type.name_ar,
                    'brand': product.brand.name_ar,
                    'profit_usd': round(profit, 2),
                    'cost_price': round(cost, 2),
                    'selling_price': round(sell, 2),
                    'calculated_profit': profit
                })
            
            # Sort by profit ascending and take bottom N
            products_with_profit.sort(key=lambda x: x['calculated_profit'])
            products_data = products_with_profit[:limit]
            
            # Remove the helper field
            for product in products_data:
                del product['calculated_profit']

        data = {
            # "total_products": total_products,
            # "limit": limit,
            "bottom_products_by_profit_usd": products_data
        }
        return Response(data, status=status.HTTP_200_OK)


class BottomProductsByProfitPercentageView(APIView):
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        # Get limit from query parameter, default to 10, max 100
        limit = request.query_params.get('limit', 10)
        try:
            limit = int(limit)
            if limit <= 0:
                limit = 10
            elif limit > 100:
                limit = 100
        except (ValueError, TypeError):
            limit = 10

        total_products = Product.objects.count()
        limit = min(limit, total_products)

        try:
            # Try using profit_percentage field if it exists (ascending order for bottom)
            bottom_products = Product.objects.order_by('profit_percentage')[:limit]
            
            products_data = []
            for product in bottom_products:
                products_data.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_percentage': round(float(product.profit_percentage), 2) if product.profit_percentage else 0.0,
                    'cost_price': round(float(product.cost_price), 2) if product.cost_price else 0.0,
                    'selling_price': round(float(product.selling_price), 2) if product.selling_price else 0.0,
                })

        except (FieldError, AttributeError):
            # Fallback: calculate profit percentage manually
            products = Product.objects.all()
            products_with_profit_pct = []
            
            for product in products:
                cost = float(product.cost_price) if getattr(product, 'cost_price', None) is not None else 0.0
                sell = float(product.selling_price) if getattr(product, 'selling_price', None) is not None else 0.0
                
                # Calculate profit percentage: (selling_price - cost_price) / cost_price * 100
                if cost > 0:
                    profit_pct = ((sell - cost) / cost) * 100
                else:
                    profit_pct = 0.0  # Avoid division by zero
                
                products_with_profit_pct.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_percentage': round(profit_pct, 2),
                    'cost_price': round(cost, 2),
                    'selling_price': round(sell, 2),
                    'calculated_profit_pct': profit_pct
                })
            
            # Sort by profit percentage ascending and take bottom N
            products_with_profit_pct.sort(key=lambda x: x['calculated_profit_pct'])
            products_data = products_with_profit_pct[:limit]
            
            # Remove the helper field
            for product in products_data:
                del product['calculated_profit_pct']

        data = {
            "total_products": total_products,
            "limit": limit,
            "bottom_products_by_profit_percentage": products_data
        }
        return Response(data, status=status.HTTP_200_OK)


# OPTIONAL: Enhanced versions with better validation and error handling
class EnhancedTopProductsByProfitUSDView(APIView):
    """
    Enhanced version with better validation and error handling.
    Query parameters:
    - limit: Number of products to return (default: 10, min: 1, max: 100)
    """
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        # Enhanced validation for limit parameter
        limit = request.query_params.get('limit', 10)
        
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid limit parameter. Must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate limit bounds
        if limit < 1:
            return Response(
                {"error": "Limit must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif limit > 100:
            return Response(
                {"error": "Limit cannot exceed 100."},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_products = Product.objects.count()
        
        if total_products == 0:
            return Response({
                "total_products": 0,
                "limit": limit,
                "requested_limit": limit,
                "top_products_by_profit_usd": [],
                "message": "No products found."
            }, status=status.HTTP_200_OK)

        # Adjust limit if it exceeds available products
        actual_limit = min(limit, total_products)
        
        try:
            # Try using profit field if it exists
            top_products = Product.objects.order_by('-profit')[:actual_limit]
            
            products_data = []
            for product in top_products:
                products_data.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_usd': round(float(product.profit), 2) if product.profit else 0.0,
                    'cost_price': round(float(product.cost_price), 2) if product.cost_price else 0.0,
                    'selling_price': round(float(product.selling_price), 2) if product.selling_price else 0.0,
                })

        except (FieldError, AttributeError):
            # Fallback: calculate profit manually
            products = Product.objects.all()
            products_with_profit = []
            
            for product in products:
                cost = float(product.cost_price) if getattr(product, 'cost_price', None) is not None else 0.0
                sell = float(product.selling_price) if getattr(product, 'selling_price', None) is not None else 0.0
                profit = sell - cost
                
                products_with_profit.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_usd': round(profit, 2),
                    'cost_price': round(cost, 2),
                    'selling_price': round(sell, 2),
                    'calculated_profit': profit
                })
            
            # Sort by profit and take top N
            products_with_profit.sort(key=lambda x: x['calculated_profit'], reverse=True)
            products_data = products_with_profit[:actual_limit]
            
            # Remove the helper field
            for product in products_data:
                del product['calculated_profit']

        response_data = {
            "total_products": total_products,
            "requested_limit": limit,
            "actual_limit": actual_limit,
            "top_products_by_profit_usd": products_data
        }
        
        # Add warning if requested limit was adjusted
        if actual_limit < limit:
            response_data["warning"] = f"Only {total_products} products available. Showing all products."

        return Response(response_data, status=status.HTTP_200_OK)


class EnhancedTopProductsByProfitPercentageView(APIView):
    """
    Enhanced version with better validation and error handling.
    Query parameters:
    - limit: Number of products to return (default: 10, min: 1, max: 100)
    """
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        # Enhanced validation for limit parameter
        limit = request.query_params.get('limit', 10)
        
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid limit parameter. Must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate limit bounds
        if limit < 1:
            return Response(
                {"error": "Limit must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif limit > 100:
            return Response(
                {"error": "Limit cannot exceed 100."},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_products = Product.objects.count()
        
        if total_products == 0:
            return Response({
                "total_products": 0,
                "limit": limit,
                "requested_limit": limit,
                "top_products_by_profit_percentage": [],
                "message": "No products found."
            }, status=status.HTTP_200_OK)

        # Adjust limit if it exceeds available products
        actual_limit = min(limit, total_products)
        
        try:
            # Try using profit_percentage field if it exists
            top_products = Product.objects.order_by('-profit_percentage')[:actual_limit]
            
            products_data = []
            for product in top_products:
                products_data.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_percentage': round(float(product.profit_percentage), 2) if product.profit_percentage else 0.0,
                    'cost_price': round(float(product.cost_price), 2) if product.cost_price else 0.0,
                    'selling_price': round(float(product.selling_price), 2) if product.selling_price else 0.0,
                })

        except (FieldError, AttributeError):
            # Fallback: calculate profit percentage manually
            products = Product.objects.all()
            products_with_profit_pct = []
            
            for product in products:
                cost = float(product.cost_price) if getattr(product, 'cost_price', None) is not None else 0.0
                sell = float(product.selling_price) if getattr(product, 'selling_price', None) is not None else 0.0
                
                # Calculate profit percentage: (selling_price - cost_price) / cost_price * 100
                if cost > 0:
                    profit_pct = ((sell - cost) / cost) * 100
                else:
                    profit_pct = 0.0  # Avoid division by zero
                
                products_with_profit_pct.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_percentage': round(profit_pct, 2),
                    'cost_price': round(cost, 2),
                    'selling_price': round(sell, 2),
                    'calculated_profit_pct': profit_pct
                })
            
            # Sort by profit percentage and take top N
            products_with_profit_pct.sort(key=lambda x: x['calculated_profit_pct'], reverse=True)
            products_data = products_with_profit_pct[:actual_limit]
            
            # Remove the helper field
            for product in products_data:
                del product['calculated_profit_pct']

        response_data = {
            "total_products": total_products,
            "requested_limit": limit,
            "actual_limit": actual_limit,
            "top_products_by_profit_percentage": products_data
        }
        
        # Add warning if requested limit was adjusted
        if actual_limit < limit:
            response_data["warning"] = f"Only {total_products} products available. Showing all products."

        return Response(response_data, status=status.HTTP_200_OK)


class EnhancedBottomProductsByProfitUSDView(APIView):
    """
    Enhanced version with better validation and error handling.
    Query parameters:
    - limit: Number of products to return (default: 10, min: 1, max: 100)
    """
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        # Enhanced validation for limit parameter
        limit = request.query_params.get('limit', 10)
        
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid limit parameter. Must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate limit bounds
        if limit < 1:
            return Response(
                {"error": "Limit must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif limit > 100:
            return Response(
                {"error": "Limit cannot exceed 100."},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_products = Product.objects.count()
        
        if total_products == 0:
            return Response({
                "total_products": 0,
                "limit": limit,
                "requested_limit": limit,
                "bottom_products_by_profit_usd": [],
                "message": "No products found."
            }, status=status.HTTP_200_OK)

        # Adjust limit if it exceeds available products
        actual_limit = min(limit, total_products)
        
        try:
            # Try using profit field if it exists (ascending order for bottom)
            bottom_products = Product.objects.order_by('profit')[:actual_limit]
            
            products_data = []
            for product in bottom_products:
                products_data.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_usd': round(float(product.profit), 2) if product.profit else 0.0,
                    'cost_price': round(float(product.cost_price), 2) if product.cost_price else 0.0,
                    'selling_price': round(float(product.selling_price), 2) if product.selling_price else 0.0,
                })

        except (FieldError, AttributeError):
            # Fallback: calculate profit manually
            products = Product.objects.all()
            products_with_profit = []
            
            for product in products:
                cost = float(product.cost_price) if getattr(product, 'cost_price', None) is not None else 0.0
                sell = float(product.selling_price) if getattr(product, 'selling_price', None) is not None else 0.0
                profit = sell - cost
                
                products_with_profit.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_usd': round(profit, 2),
                    'cost_price': round(cost, 2),
                    'selling_price': round(sell, 2),
                    'calculated_profit': profit
                })
            
            # Sort by profit ascending and take bottom N
            products_with_profit.sort(key=lambda x: x['calculated_profit'])
            products_data = products_with_profit[:actual_limit]
            
            # Remove the helper field
            for product in products_data:
                del product['calculated_profit']

        response_data = {
            "total_products": total_products,
            "requested_limit": limit,
            "actual_limit": actual_limit,
            "bottom_products_by_profit_usd": products_data
        }
        
        # Add warning if requested limit was adjusted
        if actual_limit < limit:
            response_data["warning"] = f"Only {total_products} products available. Showing all products."

        return Response(response_data, status=status.HTTP_200_OK)


class EnhancedBottomProductsByProfitPercentageView(APIView):
    """
    Enhanced version with better validation and error handling.
    Query parameters:
    - limit: Number of products to return (default: 10, min: 1, max: 100)
    """
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        # Enhanced validation for limit parameter
        limit = request.query_params.get('limit', 10)
        
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid limit parameter. Must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate limit bounds
        if limit < 1:
            return Response(
                {"error": "Limit must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif limit > 100:
            return Response(
                {"error": "Limit cannot exceed 100."},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_products = Product.objects.count()
        
        if total_products == 0:
            return Response({
                "total_products": 0,
                "limit": limit,
                "requested_limit": limit,
                "bottom_products_by_profit_percentage": [],
                "message": "No products found."
            }, status=status.HTTP_200_OK)

        # Adjust limit if it exceeds available products
        actual_limit = min(limit, total_products)
        
        try:
            # Try using profit_percentage field if it exists (ascending order for bottom)
            bottom_products = Product.objects.order_by('profit_percentage')[:actual_limit]
            
            products_data = []
            for product in bottom_products:
                products_data.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_percentage': round(float(product.profit_percentage), 2) if product.profit_percentage else 0.0,
                    'cost_price': round(float(product.cost_price), 2) if product.cost_price else 0.0,
                    'selling_price': round(float(product.selling_price), 2) if product.selling_price else 0.0,
                })

        except (FieldError, AttributeError):
            # Fallback: calculate profit percentage manually
            products = Product.objects.all()
            products_with_profit_pct = []
            
            for product in products:
                cost = float(product.cost_price) if getattr(product, 'cost_price', None) is not None else 0.0
                sell = float(product.selling_price) if getattr(product, 'selling_price', None) is not None else 0.0
                
                # Calculate profit percentage: (selling_price - cost_price) / cost_price * 100
                if cost > 0:
                    profit_pct = ((sell - cost) / cost) * 100
                else:
                    profit_pct = 0.0  # Avoid division by zero
                
                products_with_profit_pct.append({
                    'id': product.id,
                    'name': product.name,
                    'profit_percentage': round(profit_pct, 2),
                    'cost_price': round(cost, 2),
                    'selling_price': round(sell, 2),
                    'calculated_profit_pct': profit_pct
                })
            
            # Sort by profit percentage ascending and take bottom N
            products_with_profit_pct.sort(key=lambda x: x['calculated_profit_pct'])
            products_data = products_with_profit_pct[:actual_limit]
            
            # Remove the helper field
            for product in products_data:
                del product['calculated_profit_pct']

        response_data = {
            "total_products": total_products,
            "requested_limit": limit,
            "actual_limit": actual_limit,
            "bottom_products_by_profit_percentage": products_data
        }
        
        # Add warning if requested limit was adjusted
        if actual_limit < limit:
            response_data["warning"] = f"Only {total_products} products available. Showing all products."

        return Response(response_data, status=status.HTTP_200_OK)
    
# ============================================================================
# SALES REPORT API ENDPOINTS
# ============================================================================

class SalesReportListView(generics.ListAPIView):
    """
    List sales reports with filtering options
    
    Query parameters:
    - resolution: Filter by resolution (hourly, daily, weekly, monthly, yearly)
    - start_date: Filter reports from this date (YYYY-MM-DD or ISO format)
    - end_date: Filter reports until this date (YYYY-MM-DD or ISO format)
    - limit: Number of results to return (default: 50, max: 200)
    """
    serializer_class = SalesReportSerializer
    permission_classes = [AllowAny]  # FIXME

    def get_queryset(self):
        queryset = SalesReport.objects.all().order_by('-period_start')

        # Filter by resolution
        resolution = self.request.query_params.get('resolution')
        if resolution and resolution in ['hourly', 'daily', 'weekly', 'monthly', 'yearly']:
            queryset = queryset.filter(resolution=resolution)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            try:
                # First try to parse as datetime, then as date
                parsed_start = parse_datetime(start_date)
                if not parsed_start:
                    parsed_date = parse_date(start_date)
                    if parsed_date:
                        parsed_start = datetime.combine(parsed_date, datetime.min.time())
                
                if parsed_start:
                    # Ensure it's timezone-aware
                    if timezone.is_naive(parsed_start):
                        parsed_start = timezone.make_aware(parsed_start)
                    queryset = queryset.filter(period_start__gte=parsed_start)
            except ValueError:
                pass  # Invalid date format, ignore

        if end_date:
            try:
                # First try to parse as datetime, then as date
                parsed_end = parse_datetime(end_date)
                if not parsed_end:
                    parsed_date = parse_date(end_date)
                    if parsed_date:
                        parsed_end = datetime.combine(parsed_date, datetime.max.time())
                
                if parsed_end:
                    # Ensure it's timezone-aware
                    if timezone.is_naive(parsed_end):
                        parsed_end = timezone.make_aware(parsed_end)
                    queryset = queryset.filter(period_start__lte=parsed_end)
            except ValueError:
                pass  # Invalid date format, ignore

        # Apply limit
        limit = self.request.query_params.get('limit', 50)
        try:
            limit = min(int(limit), 200)  # Max 200 results
            queryset = queryset[:limit]
        except (ValueError, TypeError):
            queryset = queryset[:50]  # Default limit

        return queryset


class SalesReportDetailView(generics.RetrieveAPIView):
    """Get a specific sales report by ID"""
    serializer_class = SalesReportSerializer
    queryset = SalesReport.objects.all()
    permission_classes = [AllowAny]  # FIXME


class SalesReportSummaryView(APIView):
    """
    Get aggregated sales report summaries by resolution
    
    Query parameters:
    - resolution: Required (hourly, daily, weekly, monthly, yearly)
    - start_date: Filter from this date (optional)
    - end_date: Filter until this date (optional)
    """
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        resolution = request.query_params.get('resolution')

        if not resolution or resolution not in ['hourly', 'daily', 'weekly', 'monthly', 'yearly']:
            return Response(
                {"error": "Valid resolution parameter is required (hourly, daily, weekly, monthly, yearly)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = SalesReport.objects.filter(resolution=resolution)

        # Apply date filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if start_date:
            try:
                # First try to parse as datetime, then as date
                parsed_start = parse_datetime(start_date)
                if not parsed_start:
                    parsed_date = parse_date(start_date)
                    if parsed_date:
                        parsed_start = datetime.combine(parsed_date, datetime.min.time())
                
                if parsed_start:
                    # Ensure it's timezone-aware
                    if timezone.is_naive(parsed_start):
                        parsed_start = timezone.make_aware(parsed_start)
                    queryset = queryset.filter(period_start__gte=parsed_start)
            except ValueError:
                pass

        if end_date:
            try:
                # First try to parse as datetime, then as date
                parsed_end = parse_datetime(end_date)
                if not parsed_end:
                    parsed_date = parse_date(end_date)
                    if parsed_date:
                        parsed_end = datetime.combine(parsed_date, datetime.max.time())
                
                if parsed_end:
                    # Ensure it's timezone-aware
                    if timezone.is_naive(parsed_end):
                        parsed_end = timezone.make_aware(parsed_end)
                    queryset = queryset.filter(period_start__lte=parsed_end)
            except ValueError:
                pass

        # Calculate aggregated metrics
        aggregates = queryset.aggregate(
            total_sales_count=Sum('sales_count'),
            total_revenue=Sum('total_revenue'),
            total_profit=Sum('total_profit'),
            period_count=Count('id')
        )

        # Calculate average profit margin
        total_revenue = aggregates['total_revenue'] or Decimal('0')
        total_profit = aggregates['total_profit'] or Decimal('0')

        if total_revenue > 0:
            avg_profit_margin = (total_profit / total_revenue) * 100
        else:
            avg_profit_margin = Decimal('0')

        # Get date range
        first_period = queryset.order_by('period_start').first()
        last_period = queryset.order_by('-period_start').first()

        date_range = {}
        if first_period and last_period:
            date_range = {
                'start': first_period.period_start.isoformat(),
                'end': last_period.period_end.isoformat()
            }

        summary_data = {
            'resolution': resolution,
            'total_sales_count': aggregates['total_sales_count'] or 0,
            'total_revenue': aggregates['total_revenue'] or Decimal('0'),
            'total_profit': aggregates['total_profit'] or Decimal('0'),
            'average_profit_margin': round(float(avg_profit_margin), 2),
            'period_count': aggregates['period_count'] or 0,
            'date_range': date_range
        }

        serializer = SalesReportSummarySerializer(summary_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SalesReportTrendsView(APIView):
    """
    Get sales trends for a specific resolution showing period-over-period changes
    
    Query parameters:
    - resolution: Required (daily, weekly, monthly, yearly)
    - periods: Number of recent periods to include (default: 10, max: 50)
    """
    permission_classes = [AllowAny]  # FIXME

    def get(self, request):
        resolution = request.query_params.get('resolution')

        if not resolution or resolution not in ['daily', 'weekly', 'monthly', 'yearly']:
            return Response(
                {"error": "Valid resolution parameter is required (daily, weekly, monthly, yearly)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get number of periods
        periods = request.query_params.get('periods', 10)
        try:
            periods = min(int(periods), 50)  # Max 50 periods
        except (ValueError, TypeError):
            periods = 10

        # Get the most recent reports for this resolution
        reports = SalesReport.objects.filter(
            resolution=resolution
        ).order_by('-period_start')[:periods]

        if not reports:
            return Response({
                'resolution': resolution,
                'trends': [],
                'message': f'No {resolution} reports found'
            }, status=status.HTTP_200_OK)

        # Convert to list and reverse to get chronological order
        reports = list(reversed(reports))

        # Calculate trends
        trends = []
        for i, report in enumerate(reports):
            trend_data = {
                'period': report.period_display,
                'period_start': report.period_start.isoformat(),
                'sales_count': report.sales_count,
                'total_revenue': float(report.total_revenue),
                'total_profit': float(report.total_profit),
                'profit_margin': float(report.profit_margin),
                'average_sale_value': float(report.average_sale_value)
            }

            # Calculate period-over-period changes
            if i > 0:
                previous_report = reports[i - 1]

                # Revenue change
                if previous_report.total_revenue > 0:
                    revenue_change = ((report.total_revenue - previous_report.total_revenue) /
                                      previous_report.total_revenue) * 100
                else:
                    revenue_change = 100 if report.total_revenue > 0 else 0

                # Sales count change
                if previous_report.sales_count > 0:
                    sales_change = ((report.sales_count - previous_report.sales_count) / 
                                    previous_report.sales_count) * 100
                else:
                    sales_change = 100 if report.sales_count > 0 else 0

                trend_data['changes'] = {
                    'revenue_change_percent': round(float(revenue_change), 2),
                    'sales_count_change_percent': round(float(sales_change), 2),
                    'profit_margin_change': round(float(report.profit_margin - previous_report.profit_margin), 2)
                }
            else:
                trend_data['changes'] = None

            trends.append(trend_data)

        return Response({
            'resolution': resolution,
            'periods_requested': periods,
            'periods_returned': len(trends),
            'trends': trends
        }, status=status.HTTP_200_OK)