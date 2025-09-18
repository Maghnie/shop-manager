
import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X, Calendar, Package } from 'lucide-react';
import { useAnalyticsExport } from '../hooks/useAnalyticsExport';
import { useAvailableProducts } from '@/apps/sales/hooks/useSales';
import { AnalyticsService } from '../services/analyticsService';
import type { ExportRequest, DateRange } from '../types/analytics';

interface ExportControlsProps {
  activeTab: 'timeseries' | 'breakeven';
  onClose: () => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  activeTab,
  onClose
}) => {
  const { exporting, exportData } = useAnalyticsExport();
  const { products } = useAvailableProducts();

  // Form state
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [filename, setFilename] = useState('');

  // Time series specific state
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });
  const [resolution, setResolution] = useState<'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Breakeven specific state
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [fixedCosts, setFixedCosts] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'performance' | 'profit' | 'revenue'>('performance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleExport = async () => {
    try {
      const baseRequest: ExportRequest = {
        export_type: activeTab,
        format: exportFormat,
        filename: filename || undefined
      };

      if (activeTab === 'timeseries') {
        const request: ExportRequest = {
          ...baseRequest,
          date_from: AnalyticsService.formatDate(dateRange.startDate),
          date_to: AnalyticsService.formatDate(dateRange.endDate),
          resolution
        };
        await exportData(request);
      } else {
        const request: ExportRequest = {
          ...baseRequest,
          product_id: selectedProductId,
          fixed_costs: fixedCosts,
          sort_by: sortBy,
          sort_order: sortOrder
        };
        await exportData(request);
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const generateSuggestedFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    if (activeTab === 'timeseries') {
      return `time_series_${resolution}_${timestamp}`;
    } else {
      const productSuffix = selectedProductId ? `_product_${selectedProductId}` : '';
      return `breakeven_analysis${productSuffix}_${timestamp}`;
    }
  };

  const handleQuickDateSelect = (days: number) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    setDateRange({ startDate, endDate });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Download className="w-5 h-5" />
            تصدير بيانات {activeTab === 'timeseries' ? 'السلاسل الزمنية' : 'تحليل نقطة التعادل'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={exporting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            تنسيق الملف
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setExportFormat('csv')}
              className={`p-4 border rounded-lg transition-colors ${
                exportFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText className="w-6 h-6" />
                <span className="font-medium">CSV</span>
              </div>
              <p className="text-sm text-gray-600">
                ملف نصي مناسب للتحليل في Excel
              </p>
            </button>

            <button
              onClick={() => setExportFormat('xlsx')}
              className={`p-4 border rounded-lg transition-colors ${
                exportFormat === 'xlsx'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileSpreadsheet className="w-6 h-6" />
                <span className="font-medium">XLSX</span>
              </div>
              <p className="text-sm text-gray-600">
                ملف Excel مع تنسيق متقدم
              </p>
            </button>
          </div>
        </div>

        {/* Filename Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اسم الملف (اختياري)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={generateSuggestedFilename()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setFilename(generateSuggestedFilename())}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              اقتراح
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            سيتم إضافة امتداد الملف تلقائياً (.{exportFormat})
          </p>
        </div>

        {/* Tab-specific Options */}
        {activeTab === 'timeseries' ? (
          <div className="space-y-6 mb-6">
            <h4 className="font-medium text-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              إعدادات السلاسل الزمنية
            </h4>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                النطاق الزمني
              </label>
              
              {/* Quick Date Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                <button
                  onClick={() => handleQuickDateSelect(7)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  آخر 7 أيام
                </button>
                <button
                  onClick={() => handleQuickDateSelect(30)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  آخر 30 يوم
                </button>
                <button
                  onClick={() => handleQuickDateSelect(90)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  آخر 3 أشهر
                </button>
                <button
                  onClick={() => handleQuickDateSelect(365)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  آخر سنة
                </button>
              </div>

              {/* Custom Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">من تاريخ</label>
                  <input
                    type="date"
                    value={dateRange.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange(prev => ({
                      ...prev,
                      startDate: new Date(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={dateRange.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange(prev => ({
                      ...prev,
                      endDate: new Date(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الدقة الزمنية
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hourly">ساعية</option>
                <option value="daily">يومية</option>
                <option value="weekly">أسبوعية</option>
                <option value="monthly">شهرية</option>
                <option value="yearly">سنوية</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mb-6">
            <h4 className="font-medium text-gray-800 flex items-center gap-2">
              <Package className="w-4 h-4" />
              إعدادات تحليل نقطة التعادل
            </h4>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المنتج (اختياري)
              </label>
              <select
                value={selectedProductId || ''}
                onChange={(e) => setSelectedProductId(
                  e.target.value ? parseInt(e.target.value) : undefined
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع المنتجات</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.type_name_ar} - {product.brand_name_ar || 'بدون علامة تجارية'}
                  </option>
                ))}
              </select>
            </div>

            {/* Fixed Costs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التكاليف الثابتة
              </label>
              <input
                type="number"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Sorting Options */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ترتيب حسب
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="performance">الأداء</option>
                  <option value="profit">الربح</option>
                  <option value="revenue">الإيرادات</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اتجاه الترتيب
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">تنازلي</option>
                  <option value="asc">تصاعدي</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                تصدير البيانات
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={exporting}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>

        {/* Export Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="text-sm font-medium text-blue-800 mb-2">نصائح للتصدير:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ملفات CSV مناسبة للاستيراد في برامج أخرى</li>
            <li>• ملفات XLSX تحافظ على التنسيق والألوان</li>
            <li>• البيانات المصدرة تعكس الإعدادات المحددة حالياً</li>
            {activeTab === 'timeseries' && (
              <li>• نطاق زمني أصغر يعطي بيانات أكثر تفصيلاً</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
