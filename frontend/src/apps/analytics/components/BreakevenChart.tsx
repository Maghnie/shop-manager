import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Settings, RefreshCw, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { useBreakevenData } from '../hooks/useBreakevenData';
import { useAvailableProducts } from '@/apps/sales/hooks/useSales';
import { AnalyticsService } from '../services/analyticsService';
import { formatBreakevenForChart, getBreakevenChartOptions, isValidBreakevenData, getEmptyDataMessage } from '../utils/chartHelpers';
import type { BreakevenChartConfig } from '../types/analytics';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const BreakevenChart: React.FC = () => {
  // State management
  const [config, setConfig] = useState<BreakevenChartConfig>({
    selectedProductId: undefined,
    fixedCosts: 0,
    showBreakevenLine: true,
    showPerformanceScore: true
  });

  const [sortBy, setSortBy] = useState<'performance' | 'profit' | 'revenue'>('performance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSettings, setShowSettings] = useState(false);

  // API hooks
  const { products } = useAvailableProducts();
  const { data, loading, error, refetch } = useBreakevenData();

  // Fetch data when parameters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        await refetch({
          product_id: config.selectedProductId,
          fixed_costs: config.fixedCosts,
          sort_by: sortBy,
          sort_order: sortOrder
        });
      } catch (err) {
        toast.error('فشل في تحميل بيانات التحليل');
      }
    };

    fetchData();
  }, [config.selectedProductId, config.fixedCosts, sortBy, sortOrder, refetch]);

  // Format chart data
  const chartData = useMemo(() => {
    if (!data?.products) return null;
    return formatBreakevenForChart(data.products, config.fixedCosts);
  }, [data?.products, config.fixedCosts]);

  const chartOptions = useMemo(() => {
    return getBreakevenChartOptions();
  }, []);

  const handleConfigChange = (newConfig: Partial<BreakevenChartConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleRefresh = () => {
    refetch({
      product_id: config.selectedProductId,
      fixed_costs: config.fixedCosts,
      sort_by: sortBy,
      sort_order: sortOrder
    });
  };

  const getPerformanceStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'profitable': return 'bg-purple-100 text-purple-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'moderate': return 'متوسط';
      case 'profitable': return 'مربح';
      case 'poor': return 'ضعيف';
      default: return 'غير محدد';
    }
  };

  // Only show full loading on initial load (when there's no data)
  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !data) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg">
        {/* Product Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">المنتج:</label>
          <select
            value={config.selectedProductId || ''}
            onChange={(e) => handleConfigChange({ 
              selectedProductId: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
          >
            <option value="">جميع المنتجات</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.type_name_ar} - {product.brand_name_ar || 'بدون علامة تجارية'}
              </option>
            ))}
          </select>
        </div>

        {/* Fixed Costs Input */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">التكاليف الثابتة:</label>
          <input
            type="number"
            value={config.fixedCosts}
            onChange={(e) => handleConfigChange({ fixedCosts: parseFloat(e.target.value) || 0 })}
            className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
            placeholder="500.00"
            min="100"
            max="10000"
            step="50"
            dir="ltr"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">ترتيب حسب:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="performance">الأداء</option>
            <option value="profit">الربح</option>
            <option value="revenue">الإيرادات</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-white border border-gray-300 px-2 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">تنازلي</option>
            <option value="asc">تصاعدي</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white border border-gray-300 p-2 rounded-lg hover:border-gray-400 transition duration-200"
            aria-label="إعدادات المخطط"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:opacity-50"
            aria-label="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Chart Settings */}
      {showSettings && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">إعدادات المخطط</h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={config.showBreakevenLine}
                onChange={(e) => handleConfigChange({ showBreakevenLine: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">إظهار خط التعادل</span>
            </label>
            
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={config.showPerformanceScore}
                onChange={(e) => handleConfigChange({ showPerformanceScore: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">إظهار نقاط الأداء</span>
            </label>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي المنتجات</p>
                <p className="text-2xl font-bold">{data.summary.total_products}</p>
              </div>
              <Package className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">الأداء المرتفع</p>
                <p className="text-2xl font-bold">{data.summary.high_performers}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">الأداء المنخفض</p>
                <p className="text-2xl font-bold">{data.summary.low_performers}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">متوسط الأداء</p>
                <p className="text-2xl font-bold">
                  {data.summary.average_performance_score.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Chart Header */}
        {data?.products && data.products.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              تحليل نقطة التعادل - {data.products[0]?.product_name_ar || 'المنتج المحدد'}
            </h3>
            <div className="text-xs text-blue-700">
              نقطة التعادل: {data.products[0]?.breakeven_units} وحدة
              | الأداء الفعلي: {data.products[0]?.actual_performance.quantity_sold} وحدة
              | التكاليف الثابتة: {AnalyticsService.formatCurrency(config.fixedCosts)}
            </div>
          </div>
        )}

        <div className="relative" style={{ height: '400px' }}>
          {/* Loading Overlay - only shows when refreshing existing data */}
          {loading && data && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded">
              <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">جاري تحديث البيانات...</span>
              </div>
            </div>
          )}

          {chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-lg mb-2">📈</div>
                <div>{getEmptyDataMessage('breakeven')}</div>
                {!isValidBreakevenData(data?.products) && (
                  <div className="text-sm mt-2 text-gray-400">
                    حدد منتجاً معيناً لعرض تحليل نقطة التعادل التفصيلي
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      {data?.products && data.products.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">تفاصيل تحليل المنتجات</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنتج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نقطة التعادل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الأداء الفعلي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نقاط الأداء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المخزون المتاح
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.products.slice(0, 10).map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.product_name_ar}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.type_name_ar} - {product.brand_name_ar || 'بدون علامة تجارية'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{product.breakeven_units} وحدة</div>
                        <div className="text-gray-500">
                          {AnalyticsService.formatCurrency(product.breakeven_revenue)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{product.actual_performance.quantity_sold} وحدة</div>
                        <div className="text-gray-500">
                          {AnalyticsService.formatCurrency(product.actual_performance.revenue)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.performance_score.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceStatusColor(product.status)}`}>
                        {getPerformanceStatusText(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.available_stock} وحدة
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data.products.length > 10 && (
            <div className="px-6 py-3 bg-gray-50 text-center">
              <p className="text-sm text-gray-500">
                يتم عرض أول 10 منتجات فقط. استخدم فلتر المنتج لرؤية منتجات محددة.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
