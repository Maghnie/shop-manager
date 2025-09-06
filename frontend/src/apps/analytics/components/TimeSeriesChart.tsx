import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  Filler,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { type SalesReportTrend } from '../services/analyticsService';
import { CHART_COLORS } from '../constants';

ChartJS.register(
  Filler,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TimeSeriesChartProps {
  data: SalesReportTrend[];
  loading?: boolean;
  className?: string;
  showExport?: boolean;
  title?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  loading = false,
  className = '',
  showExport = true,
  title = 'مبيعات الإيرادات عبر الوقت'
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const downloadChart = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = 'sales-revenue-timeseries.png';
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const chartData = {
    labels: data.map(item => item.period),
    datasets: [
      {
        label: 'إجمالي الإيرادات',
        data: data.map(item => item.total_revenue),
        borderColor: CHART_COLORS.revenue,
        backgroundColor: CHART_COLORS.revenueLight,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: CHART_COLORS.revenue,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        rtl: true,
        labels: {
          font: {
            family: 'system-ui, -apple-system, sans-serif',
          },
          padding: 20,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        rtl: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: CHART_COLORS.revenue,
        borderWidth: 1,
        titleFont: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 14,
        },
        bodyFont: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 12,
        },
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const dataPoint = data[context.dataIndex];
            const change = dataPoint.changes?.revenue_change_percent;
            
            let label = `الإيرادات: ${formatCurrency(value)}`;
            if (change !== undefined) {
              const changeText = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
              const changeColor = change >= 0 ? '🔸' : '🔻';
              label += ` (${changeColor} ${changeText})`;
            }
            return label;
          },
          afterLabel: function(context) {
            const dataPoint = data[context.dataIndex];
            return [
              `عدد المبيعات: ${dataPoint.sales_count}`,
              `متوسط قيمة البيع: ${formatCurrency(dataPoint.average_sale_value)}`
            ];
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            family: 'system-ui, -apple-system, sans-serif',
          },
          callback: function(value) {
            return formatCurrency(Number(value));
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            family: 'system-ui, -apple-system, sans-serif',
          },
          maxRotation: 45,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      line: {
        borderWidth: 3,
      },
    },
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
          <div className="text-4xl mb-4">📊</div>
          <div>لا توجد بيانات متاحة للعرض</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        {showExport && (
          <button
            onClick={downloadChart}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 text-sm flex items-center space-x-2 space-x-reverse"
          >
            <span>📥</span>
            <span>تحميل المخطط</span>
          </button>
        )}
      </div>
      
      <div className="h-96">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      
      {/* Summary stats below the chart */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-sm text-gray-500">إجمالي الإيرادات</div>
          <div className="text-lg font-semibold text-blue-600">
            {formatCurrency(data.reduce((sum, item) => sum + item.total_revenue, 0))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">إجمالي المبيعات</div>
          <div className="text-lg font-semibold text-green-600">
            {data.reduce((sum, item) => sum + item.sales_count, 0).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">متوسط الإيرادات</div>
          <div className="text-lg font-semibold text-orange-600">
            {formatCurrency(data.reduce((sum, item) => sum + item.total_revenue, 0) / data.length)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">متوسط قيمة البيع</div>
          <div className="text-lg font-semibold text-purple-600">
            {formatCurrency(data.reduce((sum, item) => sum + item.average_sale_value, 0) / data.length)}
          </div>
        </div>
      </div>
    </div>
  );
};