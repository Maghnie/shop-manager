// frontend/src/apps/analytics/components/AnalyticsDashboard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Download, 
  ArrowLeft
} from 'lucide-react';
import { TimeSeriesChart } from './TimeSeriesChart';
import { BreakevenChart } from './BreakevenChart';
import { ExportControls } from './ExportControls';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState<'timeseries' | 'breakeven'>('timeseries');
  const [showExportModal, setShowExportModal] = useState(false);

  const handleTabChange = (tab: 'timeseries' | 'breakeven') => {
    setActiveTab(tab);
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              to="/"
              className="text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="العودة للرئيسية"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">
              تحليلات المنتجات والمبيعات
            </h1>
          </div>
          <p className="text-gray-600">
            تحليل شامل لأداء المنتجات والمبيعات مع إمكانية التصدير
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            تصدير البيانات
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8" aria-label="Analytics Navigation">
          <button
            onClick={() => handleTabChange('timeseries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'timeseries'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              السلاسل الزمنية
            </div>
          </button>
          
          <button
            onClick={() => handleTabChange('breakeven')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'breakeven'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              تحليل نقطة التعادل
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'timeseries' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                تحليل السلاسل الزمنية للمبيعات والأرباح
              </h2>
              <p className="text-gray-600 mb-6">
                تتبع الإيرادات والتكاليف والأرباح عبر الزمن بدقة زمنية قابلة للتخصيص
              </p>
              <TimeSeriesChart />
            </div>
          </div>
        )}

        {activeTab === 'breakeven' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                تحليل نقطة التعادل للمنتجات
              </h2>
              <p className="text-gray-600 mb-6">
                تحليل أداء المنتجات وتحديد نقطة التعادل لكل منتج مع إمكانية الترتيب حسب الأداء
              </p>
              <BreakevenChart />
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportControls
          activeTab={activeTab}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

