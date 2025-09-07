import React, { useState } from 'react';
import { TimeSeriesChart, SalesHeatmap, ResolutionSelector } from '../components';
import { useSalesTimeSeries, useSalesHeatmapData } from '../hooks/useSalesTimeSeries';
import { RESOLUTION_OPTIONS } from '../constants';

// Get arabic label from english value for time resolution
const getLabel = (value: string) => {
  return RESOLUTION_OPTIONS.find(option => option.value === value)?.label || 'Unknown';
};

export const SalesAnalyticsDashboard: React.FC = () => {
  const [resolution, setResolution] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [heatmapResolution, setHeatmapResolution] = useState<'hourly' | 'daily'>('daily');

  // Fetch time series data
  const { 
    data: timeSeriesData, 
    isLoading: timeSeriesLoading, 
    error: timeSeriesError 
  } = useSalesTimeSeries({ 
    resolution, 
    periods: 30 // Last 30 periods
  });

  // Fetch heatmap data
  const { 
    data: heatmapData, 
    isLoading: heatmapLoading, 
    error: heatmapError 
  } = useSalesHeatmapData(heatmapResolution);

  const handleResolutionChange = (newResolution: string) => {
    setResolution(newResolution as 'daily' | 'weekly' | 'monthly' | 'yearly');
  };

  const handleHeatmapResolutionChange = (newResolution: 'hourly' | 'daily') => {
    setHeatmapResolution(newResolution);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* CSS Grid Container - Full Height Layout */}
      <div 
        className="h-screen grid gap-4"
        style={{
          gridTemplateColumns: '2fr 2fr 1fr',
          gridTemplateRows: '1fr 1fr 1fr',
          gridTemplateAreas: `
            "header header stats"
            "chart chart stats"
            "heatmap heatmap heatmap"
          `
        }}
      >
        
        {/* Header Area */}
        <div style={{ gridArea: 'header' }} className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">تحليلات المبيعات</h1>
          <p className="text-gray-600">تحليل شامل لإيرادات المبيعات والاتجاهات الزمنية</p>
        </div>

        {/* Stats Area - Right Side */}
        <div style={{ gridArea: 'stats' }} className="flex flex-col space-y-4">
          {/* Quick Stats Summary */}
          {timeSeriesData?.trends && timeSeriesData.trends.length > 0 ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 h-full flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">ملخص سريع</h3>
              <div className="grid grid-cols-1 gap-4 flex-1">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-blue-600">
                    {timeSeriesData.trends.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">فترات زمنية محللة</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-green-600">
                    {timeSeriesData.trends.reduce((sum, trend) => sum + trend.sales_count, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">إجمالي المبيعات</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">
                    ${timeSeriesData.trends.reduce((sum, trend) => sum + trend.total_revenue, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">إجمالي الإيرادات</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-orange-600">
                    ${(timeSeriesData.trends.reduce((sum, trend) => sum + trend.total_revenue, 0) / timeSeriesData.trends.length).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">متوسط الإيرادات</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl p-6 h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <div>في انتظار البيانات</div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Area - Main Chart */}
        <div style={{ gridArea: 'chart' }} className="bg-white rounded-xl shadow-lg p-10 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">الإيرادات عبر الوقت</h2>
            <ResolutionSelector
              value={resolution}
              onChange={handleResolutionChange}
            />
          </div>

          {timeSeriesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="text-red-800 text-sm">
                خطأ في تحميل بيانات السلسلة الزمنية: {timeSeriesError.message}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0">
            <TimeSeriesChart
              data={timeSeriesData?.trends || []}
              loading={timeSeriesLoading}
              title={`اتجاهات الإيرادات - ${getLabel(resolution)}`}
              className="h-full"
            />
          </div>
        </div>

        {/* Heatmap Area - Bottom Full Width */}
        <div style={{ gridArea: 'heatmap' }} className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">خريطة نشاط المبيعات</h2>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={() => handleHeatmapResolutionChange('hourly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  heatmapResolution === 'hourly'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                🕐 ساعي
              </button>
              <button
                onClick={() => handleHeatmapResolutionChange('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  heatmapResolution === 'daily'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                📅 يومي
              </button>
            </div>
          </div>

          {heatmapError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="text-red-800 text-sm">
                خطأ في تحميل بيانات الخريطة الحرارية: {heatmapError.message}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0">
            <SalesHeatmap
              data={heatmapData || []}
              resolution={heatmapResolution}
              loading={heatmapLoading}
              title={heatmapResolution === 'hourly' ? 'نشاط المبيعات الساعي (آخر 7 أيام)' : 'نشاط المبيعات اليومي (آخر أسبوع)'}
              className="h-full"
            />
          </div>
        </div>

        {/* Empty State Overlay */}
        {!timeSeriesLoading && !heatmapLoading && 
         (!timeSeriesData?.trends || timeSeriesData.trends.length === 0) && 
         (!heatmapData || heatmapData.length === 0) && (
          <div 
            className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl"
            style={{ gridArea: '1 / 1 / -1 / -1' }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد بيانات متاحة</h3>
              <p className="text-gray-500">يبدو أنه لا توجد بيانات مبيعات لعرضها في الوقت الحالي.</p>
              <p className="text-gray-500 text-sm mt-2">تأكد من وجود مبيعات في النظام أو جرب تغيير الفترة الزمنية.</p>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Mobile Layout */}
      {/* <style jsx>{`
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto auto 1fr 1fr !important;
            grid-template-areas: 
              "header"
              "stats"
              "chart"
              "heatmap" !important;
          }
        }
      `}</style> */}
    </div>
  );
};