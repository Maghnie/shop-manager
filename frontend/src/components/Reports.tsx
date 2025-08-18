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
  type ChartData,
  type ChartOptions,
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

type Stats = { // TODO remove hardcoded structure of endpoint response
  total_products: number;
  summary: Summary;
};

type ColorName = "green" | "purple" | "orange" | "blue" | "red";

interface StatCardProps {
  color: ColorName;
  label: string;
  value: string | number;
  icon: string;
}

const colorClasses: Record<ColorName, { from: string; to: string; text: string }> = {
  green: {
    from: "from-green-500",
    to: "to-green-600",
    text: "text-green-100",
  },
  purple: {
    from: "from-purple-500",
    to: "to-purple-600",
    text: "text-purple-100",
  },
  orange: {
    from: "from-orange-500",
    to: "to-orange-600",
    text: "text-orange-100",
  },
  blue: {
    from: "from-blue-500",
    to: "to-blue-600",
    text: "text-blue-100",
  },
  red: {
    from: "from-red-500",
    to: "to-red-600",
    text: "text-red-100",
  },
};

export const StatCard: React.FC<StatCardProps> = ({ color, label, value, icon }) => {
  const { from, to, text } = colorClasses[color];

  return (
    <div className={`bg-gradient-to-br ${from} ${to} text-white rounded-xl shadow-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${text} text-sm`}>{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <span className="text-4xl opacity-80">{icon}</span>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  bgColorClass: string;
  children: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, bgColorClass, children }) => (
  <div className={`${bgColorClass} rounded-lg p-6`}>
    <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
    {children}
  </div>
);


interface StatRowProps {
  label: string;
  value: React.ReactNode;
}

const StatRow: React.FC<StatRowProps> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

interface Product {
  type: string;
  brand: string;
  id: number;
  profit_usd?: number;
  profit_percentage?: number;
}

interface ProductListProps {
  data: Product[];
  valueFormatter: (product: Product) => string;
  showRank?: boolean;
}

const rankColors = ["bg-yellow-500", "bg-gray-400", "bg-orange-600"];

const ProductList: React.FC<ProductListProps> = ({ data, valueFormatter, showRank = true }) => (
  <div className="space-y-3">
    {data.slice(0, 3).map((product, index) => (
      <div key={index} className="flex justify-between items-center">
        <div className="flex items-center">
          {showRank ? (
            <span
              className={`inline-block w-6 h-6 rounded-full text-white text-xs flex items-center justify-center mr-3 ${rankColors[index] || ""}`}
            >
              {index + 1}
            </span>
          ) : (
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-3"></span>
          )}
          <span className="text-sm">{`${product.type} ${product.brand} رقم ${product.id}`}</span>
        </div>
        <span className={`font-semibold ${showRank ? "text-green-600" : "text-red-600"}`}>
          {valueFormatter(product)}
        </span>
      </div>
    ))}
  </div>
);

const Reports = () => {
  const [reportData, setReportData] = useState<Stats>();
  const [top10ProfitUsdData, settop10ProfitUsdData] = useState([]);
  const [top10ProfitPctData, settop10ProfitPctData] = useState([]);
  const [bottom10ProfitUsdData, setbottom10ProfitUsdData] = useState([]);
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
      // const response = await axios.get('reports/');
      // setReportData(response.data);
      
      const [reportDataRes, top10ProfitUsdRes, top10ProfitPctRes, bottom10ProfitUsdRes] = await Promise.all([
        axios.get('reports/'), // TODO remove hardcoded api endpoints
        axios.get('reports/top-products/profit-usd/'),
        axios.get('reports/top-products/profit-percentage/'),
        axios.get('reports/bottom-products/profit-usd/'),
      ]);
            
      setReportData(reportDataRes.data);          
      settop10ProfitUsdData(top10ProfitUsdRes.data.top_products_by_profit_usd);
      settop10ProfitPctData(top10ProfitPctRes.data.top_products_by_profit_percentage);
      setbottom10ProfitUsdData(bottom10ProfitUsdRes.data.bottom_products_by_profit_usd);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };

  const downloadChart = (chartRef: React.RefObject<any>, filename: string) => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  const getChartData = (data: Product[], valueKey: keyof Product, labelKey: keyof Product = 'type') => {
    const top10 = data.slice(0, 10);
    
    return {
      labels: top10.map(item => `${item.type} ${item[labelKey]} رقم ${item.id}` || 'غير محدد'),
      datasets: [
        {
          label: valueKey === 'profit_usd' ? 'الربح ($)' : 
                 valueKey === 'profit_percentage' ? 'نسبة الربح (%)' : 'القيمة',
          data: top10.map(item => parseFloat(String(item[valueKey] || 0))),
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

  const chartOptions: ChartOptions<'bar' | 'line'> = {
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

  const pieOptions: ChartOptions<'pie'> = {
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
        },
      },
      tooltip: {
        rtl: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed as number;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
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
        <StatCard
          color="blue"
          label="إجمالي المنتجات"
          value={`${reportData.total_products}`}
          icon="📦"
        />
        <StatCard
          color="green"
          label="متوسط الربح"
          value={formatCurrency(reportData.summary.avg_profit_usd)}
          icon="💰"
        />
        <StatCard
          color="purple"
          label="متوسط نسبة الربح"
          value={`${reportData.summary.avg_profit_pct.toFixed(1)}%`}
          icon="📈"
        />
        <StatCard
          color="orange"
          label="أعلى ربح"
          value={formatCurrency(reportData.summary.max_profit_usd)}
          icon="🎯"
        />
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
                    data={getChartData(top10ProfitUsdData, 'profit_usd', 'brand')}
                    options={chartOptions}
                  />
                </div>
                <div className="h-100 gap-20">
                  <Pie
                    data={getChartData(top10ProfitUsdData, 'profit_usd', 'brand')}
                    options={pieOptions}
                  />
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
                    data={getChartData(top10ProfitPctData, 'profit_percentage', 'brand')}
                    options={chartOptions}
                  />
                </div> */}
                <div className="h-96">
                  <Line
                    data={{
                      ...getChartData(top10ProfitPctData, 'profit_percentage', 'brand'),
                      datasets: [{
                        ...getChartData(top10ProfitPctData, 'profit_percentage', 'brand').datasets[0],
                        fill: false,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        tension: 0.1,
                      }]
                    }}
                    options={chartOptions}
                  />
                </div>
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
                      ...getChartData(bottom10ProfitUsdData, 'profit_usd', 'brand'),
                      datasets: [{
                        ...getChartData(bottom10ProfitUsdData, 'profit_usd', 'brand').datasets[0],
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
                        {/* <th className="text-right py-2">نسبة الربح</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {bottom10ProfitUsdData.slice(0, 10).map((product: Product, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2">{product.type+' '+product.brand+' رقم '+product.id}</td>
                          <td className="py-2 text-red-600">{formatCurrency(product.profit_usd)}</td>
                          {/* <td className="py-2 text-red-600">{product.profit_percentage.toFixed(1)}%</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "summary" && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">ملخص شامل للأرباح</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  
                  <SummaryCard title="إحصائيات الأرباح" bgColorClass="bg-gray-50">
                    <div className="space-y-3">
                      <StatRow label="متوسط الربح:" value={formatCurrency(reportData.summary.avg_profit_usd)} />
                      <StatRow label="متوسط نسبة الربح:" value={`${reportData.summary.avg_profit_pct.toFixed(1)}%`} />
                      <StatRow label="أعلى ربح:" value={<span className="text-green-600">{formatCurrency(reportData.summary.max_profit_usd)}</span>} />
                      <StatRow label="أقل ربح:" value={<span className="text-red-600">{formatCurrency(reportData.summary.min_profit_usd)}</span>} />
                    </div>
                  </SummaryCard>

                  <SummaryCard title="أفضل 3 منتجات (الربح $)" bgColorClass="bg-blue-50">
                    <ProductList
                      data={top10ProfitUsdData}
                      valueFormatter={(p) => formatCurrency(p.profit_usd!)}
                    />
                  </SummaryCard>
                </div>

                <div className="space-y-6">
                  <SummaryCard title="أفضل 3 منتجات (نسبة الربح %)" bgColorClass="bg-green-50">
                    <ProductList
                      data={top10ProfitPctData}
                      valueFormatter={(p) => `${p.profit_percentage!.toFixed(1)}%`}
                    />
                  </SummaryCard>

                  <SummaryCard title="المنتجات التي تحتاج مراجعة" bgColorClass="bg-red-50">
                    <ProductList
                      data={bottom10ProfitUsdData}
                      valueFormatter={(p) => formatCurrency(p.profit_usd!)}
                      showRank={false}
                    />
                  </SummaryCard>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Reports;