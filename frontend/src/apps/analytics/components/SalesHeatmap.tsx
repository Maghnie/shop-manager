import React from 'react';
import { type SalesReportData } from '../services/analyticsService';
import { HEATMAP_COLORS, DAYS_OF_WEEK, HOURS_24 } from '../constants';

interface SalesHeatmapProps {
  data: SalesReportData[];
  resolution: 'hourly' | 'daily';
  loading?: boolean;
  className?: string;
  title?: string;
}

interface HeatmapCell {
  value: number;
  count: number;
  display: string;
  revenue: number;
}

export const SalesHeatmap: React.FC<SalesHeatmapProps> = ({
  data,
  resolution,
  loading = false,
  className = '',
  title
}) => {
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getHeatmapData = (): HeatmapCell[][] => {
    if (resolution === 'hourly') {
      // Create 7 days x 24 hours grid
      const grid: HeatmapCell[][] = Array(7).fill(null).map(() =>
        Array(24).fill(null).map(() => ({ value: 0, count: 0, display: '0', revenue: 0 }))
      );

      data.forEach(item => {
        const date = new Date(item.period_start);
        const dayOfWeek = date.getDay(); // 0 = Sunday
        const hour = date.getHours();
        
        grid[dayOfWeek][hour] = {
          value: item.sales_count,
          count: item.sales_count,
          display: item.sales_count.toString(),
          revenue: item.total_revenue
        };
      });

      return grid;
    } else {
      // Create 1 week x 7 days grid (simplified daily view)
      const grid: HeatmapCell[][] = [Array(7).fill(null).map(() => ({ value: 0, count: 0, display: '0', revenue: 0 }))];
      
      data.forEach(item => {
        const date = new Date(item.period_start);
        const dayOfWeek = date.getDay();
        
        grid[0][dayOfWeek] = {
          value: item.sales_count,
          count: item.sales_count,
          display: item.sales_count.toString(),
          revenue: item.total_revenue
        };
      });

      return grid;
    }
  };

  const getColorIntensity = (value: number, maxValue: number): string => {
    if (value === 0) return HEATMAP_COLORS.empty;
    
    const intensity = value / maxValue;
    if (intensity <= 0.25) return HEATMAP_COLORS.low;
    if (intensity <= 0.75) return HEATMAP_COLORS.medium;
    return HEATMAP_COLORS.high;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🗓️</div>
          <div>لا توجد بيانات متاحة للعرض</div>
        </div>
      </div>
    );
  }

  const heatmapData = getHeatmapData();
  const maxValue = Math.max(...heatmapData.flat().map(cell => cell.value));
  const totalRevenue = data.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalSales = data.reduce((sum, item) => sum + item.sales_count, 0);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {title || (resolution === 'hourly' ? 'خريطة المبيعات الساعية' : 'خريطة المبيعات اليومية')}
        </h3>
        <div className="flex items-center space-x-6 space-x-reverse text-sm text-gray-600">
          <div>إجمالي المبيعات: <span className="font-semibold text-blue-600">{totalSales}</span></div>
          <div>إجمالي الإيرادات: <span className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</span></div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {resolution === 'hourly' ? (
            <div>
              {/* Hours header */}
              <div className="flex">
                <div className="w-20 h-8 flex items-center justify-center text-sm font-medium text-gray-700">اليوم</div>
                {HOURS_24.map((hour, index) => (
                  <div key={index} className="w-8 h-8 flex items-center justify-center text-xs text-gray-600 font-medium">
                    {index % 4 === 0 ? hour.split(':')[0] : ''}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              {heatmapData.map((row, dayIndex) => (
                <div key={dayIndex} className="flex">
                  <div className="w-20 h-8 flex items-center justify-center text-sm font-medium text-gray-700 bg-gray-50">
                    {DAYS_OF_WEEK[dayIndex]}
                  </div>
                  {row.map((cell, hourIndex) => (
                    <div
                      key={hourIndex}
                      className="w-8 h-8 border border-gray-200 flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all group relative"
                      style={{ backgroundColor: getColorIntensity(cell.value, maxValue) }}
                      title={`${DAYS_OF_WEEK[dayIndex]} ${HOURS_24[hourIndex]}: ${cell.count} مبيعات (${formatCurrency(cell.revenue)})`}
                    >
                      {cell.value > 0 && (
                        <span className={cell.value > 9 ? 'text-xs' : 'text-sm'}>
                          {cell.value}
                        </span>
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-medium">{DAYS_OF_WEEK[dayIndex]} {HOURS_24[hourIndex]}</div>
                        <div>المبيعات: {cell.count}</div>
                        <div>الإيرادات: {formatCurrency(cell.revenue)}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div>
              {/* Daily view - simplified */}
              <div className="flex justify-center">
                {heatmapData[0].map((cell, dayIndex) => (
                  <div key={dayIndex} className="text-center mx-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">{DAYS_OF_WEEK[dayIndex]}</div>
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-lg font-bold cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all relative group"
                      style={{ backgroundColor: getColorIntensity(cell.value, maxValue) }}
                      title={`${DAYS_OF_WEEK[dayIndex]}: ${cell.count} مبيعات (${formatCurrency(cell.revenue)})`}
                    >
                      {cell.value}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-medium">{DAYS_OF_WEEK[dayIndex]}</div>
                        <div>المبيعات: {cell.count}</div>
                        <div>الإيرادات: {formatCurrency(cell.revenue)}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse text-sm">
          <span className="text-gray-600">أقل</span>
          <div className="flex space-x-1 space-x-reverse">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: HEATMAP_COLORS.empty }}></div>
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: HEATMAP_COLORS.low }}></div>
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: HEATMAP_COLORS.medium }}></div>
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: HEATMAP_COLORS.high }}></div>
          </div>
          <span className="text-gray-600">أكثر</span>
        </div>
        
        <div className="text-sm text-gray-600">
          أعلى قيمة: <span className="font-semibold">{maxValue} مبيعات</span>
        </div>
      </div>
    </div>
  );
};