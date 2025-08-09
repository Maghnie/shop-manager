import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Summary = {
  avg_profit_usd: number;
  avg_profit_pct: number;
  max_profit_usd: number;
  min_profit_usd: number;
};

type Stats = {
  total_products: number;
  summary: Summary;
};

const Reports = () => {
  const [reportData, setReportData] = useState<Stats>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profit-usd');
  const chartRefs = {
    profitUsd: useRef(),
    profitPct: useRef(),
    lowestProfit: useRef()
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await axios.get('reports/');
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `$${parseFloat(amount).toFixed(2)}`;

  const downloadChart = (chartRef, filename) => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  const getChartData = (data, valueKey, labelKey = 'type__name_ar') => {
    const top10 = data.slice(0, 10);
    
    return {
      labels: top10.map(item => item[labelKey] || 'غير محدد'),
      datasets: [
        {
          label: valueKey === 'profit' ? 'الربح ($)' : 
                 valueKey === 'profit_percentage' ? 'نسبة الربح (%)' : 'القيمة',
          data: top10.map(item => parseFloat(item[valueKey] || 0)),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(20, 184, 166, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(167, 139, 250, 0.8)',
            'rgba(34, 197, 94, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(20, 184, 166, 1)',
            'rgba(251, 146, 60, 1)',
            'rgba(167, 139, 250, 1)',
            'rgba(34, 197, 94, 1)'
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        rtl: true,
        labels: {
          font: {
            family: 'system-ui, -apple-system, sans-serif',
          }
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        rtl: true,
        titleFont: {
          family: 'system-ui, -apple-system, sans-serif',
        },
        bodyFont: {
          family: 'system-ui, -apple-system, sans-serif',
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'system-ui, -apple-system, sans-serif',
          }
        }
      },
      x: {
        ticks: {
          font: {
            family: 'system-ui, -apple-system, sans-serif',
          },
          maxRotation: 45,
        }
      }
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        rtl: true,
        labels: {
          font: {
            family: 'system-ui, -apple-system, sans-serif',
          },
          padding: 20,
        }
      },
      tooltip: {
        rtl: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل التقارير...</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">التقارير والتحليلات</h1>
          <p className="text-gray-600">لا توجد بيانات متاحة لعرض التقارير</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profit-usd', label: 'أعلى ربح ($)', icon: '💰' },
    { id: 'profit-pct', label: 'أعلى نسبة ربح (%)', icon: '📈' },
    { id: 'lowest-profit', label: 'أقل ربح', icon: '📉' },
    { id: 'summary', label: 'الملخص', icon: '📊' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">التقارير والتحليلات</h1>
        <p className="text-gray-600">تحليل شامل لأرباح المنتجات والإحصائيات</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">إجمالي المنتجات</p>
              <p className="text-3xl font-bold">{reportData.total_products}</p>
            </div>
            <span className="text-4xl opacity-80">📦</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">متوسط الربح</p>
              <p className="text-3xl font-bold">{formatCurrency(reportData.summary.avg_profit_usd)}</p>
            </div>
            <span className="text-4xl opacity-80">💰</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">متوسط نسبة الربح</p>
              <p className="text-3xl font-bold">{reportData.summary.avg_profit_pct.toFixed(1)}%</p>
            </div>
            <span className="text-4xl opacity-80">📈</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">أعلى ربح</p>
              <p className="text-3xl font-bold">{formatCurrency(reportData.summary.max_profit_usd)}</p>
            </div>
            <span className="text-4xl opacity-80">🎯</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 space-x-reverse px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 space-x-reverse ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profit-usd' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">المنتجات ذات أعلى ربح بالدولار</h3>
                <button
                  onClick={() => downloadChart(chartRefs.profitUsd, 'top-profit-usd')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                >
                  تحميل المخطط
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-96">
                  <Bar
                    ref={chartRefs.profitUsd}
                    data={getChartData(reportData.summary.max_profit_usd, 'profit')}
                    options={chartOptions}
                  />
                </div>
                <div className="h-96">
                  {/* <Pie
                    data={getChartData(reportData.summary.max_profit_usd, 'profit')}
                    options={pieOptions}
                  /> */}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profit-pct' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">المنتجات ذات أعلى نسبة ربح</h3>
                <button
                  onClick={() => downloadChart(chartRefs.profitPct, 'top-profit-percentage')}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                >
                  تحميل المخطط
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* <div className="h-96">
                  <Bar
                    ref={chartRefs.profitPct}
                    data={getChartData(reportData.top_profit_percentage, 'profit_percentage')}
                    options={chartOptions}
                  />
                </div> */}
                {/* <div className="h-96">
                  <Line
                    data={{
                      ...getChartData(reportData.top_profit_percentage, 'profit_percentage'),
                      datasets: [{
                        ...getChartData(reportData.top_profit_percentage, 'profit_percentage').datasets[0],
                        fill: false,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        tension: 0.1,
                      }]
                    }}
                    options={chartOptions}
                  />
                </div> */}
              </div>
            </div>
          )}

          {activeTab === 'lowest-profit' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">المنتجات ذات أقل ربح</h3>
                <button
                  onClick={() => downloadChart(chartRefs.lowestProfit, 'lowest-profit')}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
                >
                  تحميل المخطط
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-96">
                  <Bar
                    ref={chartRefs.lowestProfit}
                    data={{
                      ...getChartData(reportData.summary.lowest_profit, 'profit'),
                      datasets: [{
                        ...getChartData(reportData.lowest_profit, 'profit').datasets[0],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                      }]
                    }}
                    options={chartOptions}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2">المنتج</th>
                        <th className="text-right py-2">الربح</th>
                        <th className="text-right py-2">نسبة الربح</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.lowest_profit.slice(0, 10).map((product, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2">{product.type_name_ar}</td>
                          <td className="py-2 text-red-600">{formatCurrency(product.profit)}</td>
                          <td className="py-2 text-red-600">{product.profit_percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">ملخص شامل للأرباح</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">إحصائيات الأرباح</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">متوسط الربح:</span>
                        <span className="font-semibold">{formatCurrency(reportData.summary.avg_profit_usd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">متوسط نسبة الربح:</span>
                        <span className="font-semibold">{reportData.summary.avg_profit_pct.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">أعلى ربح:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(reportData.summary.max_profit_usd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">أقل ربح:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(reportData.summary.min_profit_usd)}</span>
                      </div>
                    </div>
                  </div>

                  {/* <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">أفضل 3 منتجات (الربح $)</h4>
                    <div className="space-y-3">
                      {reportData.summary.max_profit_usd.slice(0, 3).map((product, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className={`inline-block w-6 h-6 rounded-full text-white text-xs flex items-center justify-center mr-3 ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="text-sm">{product.type__name_ar}</span>
                          </div>
                          <span className="font-semibold text-green-600">{formatCurrency(product.profit)}</span>
                        </div>
                      ))}
                    </div>
                  </div> */}
                </div>

                {/* <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">أفضل 3 منتجات (نسبة الربح %)</h4>
                    <div className="space-y-3">
                      {reportData.summary.max_profit_percentage.slice(0, 3).map((product, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className={`inline-block w-6 h-6 rounded-full text-white text-xs flex items-center justify-center mr-3 ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="text-sm">{product.type__name_ar}</span>
                          </div>
                          <span className="font-semibold text-green-600">{product.profit_percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div> */}

                  {/* <div className="bg-red-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">المنتجات التي تحتاج مراجعة</h4>
                    <div className="space-y-3">
                      {reportData.lowest_profit.slice(0, 3).map((product, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-3"></span>
                            <span className="text-sm">{product.type_name_ar}</span>
                          </div>
                          <span className="font-semibold text-red-600">{formatCurrency(product.profit)}</span>
                        </div>
                      ))}
                    </div>
                  </div> */}
                {/* </div> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;