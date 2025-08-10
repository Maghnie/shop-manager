# reports/views.py
from decimal import Decimal
from django.db.models import Avg, Max, Min, F, Case, When, Value, FloatField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny  # FIXME
from django.core.exceptions import FieldError

from inventory.models import Product


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
                "total_products": total_products,
                "limit": limit,
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