# reports/views.py
from decimal import Decimal
from django.db.models import Avg, Max
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
                    # "min_profit_usd": round(to_num(agg.get('min_profit_usd')), 2),
                    "max_profit_usd": round(to_num(agg.get('max_profit_usd')), 2),
                    "avg_profit_usd": round(to_num(agg.get('avg_profit_usd')), 2),
                    # "min_profit_pct": round(to_num(agg.get('min_profit_pct')), 2),
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
