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
import { Calendar, Settings, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';
import { useTimeSeriesData } from '../hooks/useTimeSeriesData';
import { DateRangePicker } from './DateRangePicker';
import { AnalyticsService } from '../services/analyticsService';
import { formatTimeSeriesForChart, getTimeSeriesChartOptions, isValidTimeSeriesData, getEmptyDataMessage } from '../utils/chartHelpers';
import type { DateRange, ChartConfig } from '../types/analytics';
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

export const TimeSeriesChart: React.FC = () => {
  // State management
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });
  
  const [resolution, setResolution] = useState</*'hourly' |*/ 'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    showRevenue: true,
    showCosts: true,
    showProfit: true,
    showSalesCount: false
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // API hook
  const { data, loading, error, refetch } = useTimeSeriesData();

  // Generate a params key for dependency tracking
  const paramsKey = useMemo(() => {
    return `${AnalyticsService.formatDate(dateRange.startDate)}_${AnalyticsService.formatDate(dateRange.endDate)}_${resolution}`;
  }, [dateRange.startDate, dateRange.endDate, resolution]);

  // Fetch data when parameters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        await refetch({
          date_from: AnalyticsService.formatDate(dateRange.startDate),
          date_to: AnalyticsService.formatDate(dateRange.endDate),
          resolution
        });
      } catch (err) {
        console.error('Failed to fetch time series data:', err);
        toast.error('فشل في تحميل البيانات');
      }
    };

    fetchData();
  }, [paramsKey, refetch]); // Use paramsKey for cleaner dependency tracking

  // Format chart data
  const chartData = useMemo(() => {
    if (!data?.data) return null;
    return formatTimeSeriesForChart(data.data, chartConfig);
  }, [data?.data, chartConfig]);

  // Chart options
  const chartOptions = useMemo(() => {
    return getTimeSeriesChartOptions(chartConfig.showSalesCount);
  }, [chartConfig.showSalesCount]);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
    setShowDatePicker(false);
  };

  const handleResolutionChange = (newResolution: string) => {
    setResolution(newResolution as any);
  };

  const handleChartConfigChange = (config: Partial<ChartConfig>) => {
    setChartConfig(prev => ({ ...prev, ...config }));
  };

  const handleRefresh = () => {
    refetch({
      date_from: AnalyticsService.formatDate(dateRange.startDate),
      date_to: AnalyticsService.formatDate(dateRange.endDate),
      resolution
    });
  };

  // Only show full loading on initial load (when there's no data)
  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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
        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="bg-white border border-gray-300 px-3 py-2 rounded-lg hover:border-gray-400 transition duration-200 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {dateRange.startDate.toLocaleDateString('ar-LB')} - {dateRange.endDate.toLocaleDateString('ar-LB')}
            </span>
          </button>
          
          {showDatePicker && (
            <DateRangePicker
              dateRange={dateRange}
              onChange={handleDateRangeChange}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </div>

        {/* Resolution Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">الدقة الزمنية:</label>
          <select
            value={resolution}
            onChange={(e) => handleResolutionChange(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* <option value="hourly">ساعية</option> */}
            <option value="daily">يومية</option>
            <option value="weekly">أسبوعية</option>
            <option value="monthly">شهرية</option>
            <option value="yearly">سنوية</option>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={chartConfig.showRevenue}
                onChange={(e) => handleChartConfigChange({ showRevenue: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">الإيرادات</span>
            </label>

            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={chartConfig.showCosts}
                onChange={(e) => handleChartConfigChange({ showCosts: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">التكاليف</span>
            </label>

            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={chartConfig.showProfit}
                onChange={(e) => handleChartConfigChange({ showProfit: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">الأرباح</span>
            </label>

            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={chartConfig.showSalesCount}
                onChange={(e) => handleChartConfigChange({ showSalesCount: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">عدد المبيعات</span>
            </label>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">
                  {AnalyticsService.formatCurrency(data.summary.total_revenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">إجمالي التكاليف</p>
                <p className="text-2xl font-bold">
                  {AnalyticsService.formatCurrency(data.summary.total_costs)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">صافي الربح</p>
                <p className="text-2xl font-bold">
                  {AnalyticsService.formatCurrency(data.summary.total_profit)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">هامش الربح</p>
                <p className="text-2xl font-bold">
                  {AnalyticsService.formatPercentage(data.summary.profit_margin)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
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
                <div className="text-lg mb-2">📊</div>
                <div>{getEmptyDataMessage('timeseries')}</div>
                {!isValidTimeSeriesData(data?.data) && (
                  <div className="text-sm mt-2 text-gray-400">
                    جرب تعديل النطاق الزمني أو التحقق من وجود مبيعات
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};