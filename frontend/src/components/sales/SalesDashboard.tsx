// src/components/sales/SalesDashboard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Calendar,
  Users,
  Target,
  Award,
  AlertTriangle
} from 'lucide-react';
import { useSalesStats } from '../../hooks/useSales';
import LowStockAlerts from '../inventory/LowStockAlerts';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const SalesDashboard: React.FC = () => {
  const { stats, loading, error, refetch } = useSalesStats();

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };

  const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color, 
    bgColor 
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${bgColor} ${color} ml-4`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">حدث خطأ في تحميل البيانات</div>
          <button
            onClick={refetch}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-600 mb-4">لا توجد بيانات متاحة</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">لوحة تحكم المبيعات</h1>
          <p className="text-gray-600">نظرة شاملة على أداء المبيعات والأرباح</p>
        </div>
        
        <div className="flex gap-2">
          <Link
            to="/sales/new"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            بيعة جديدة
          </Link>
          <Link
            to="/sales/quick"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
          >
            بيعة سريعة
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي المبيعات"
          value={stats.overview.total_sales.toString()}
          subtitle="عدد البيعات المكتملة"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats.overview.total_revenue)}
          subtitle={`هامش ربح ${stats.overview.profit_margin.toFixed(1)}%`}
          icon={<DollarSign className="w-6 h-6" />}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        
        <StatCard
          title="إجمالي الأرباح"
          value={formatCurrency(stats.overview.total_profit)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        
        <StatCard
          title="تنبيهات المخزون"
          value={stats.overview.low_stock_alerts.toString()}
          subtitle="منتجات بحاجة لإعادة تعبئة"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Time Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Today */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>اليوم</span>
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">المبيعات:</span>
              <span className="font-semibold">{stats.today.sales_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الإيرادات:</span>
              <span className="font-semibold">{formatCurrency(stats.today.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الأرباح:</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.today.profit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">هامش الربح:</span>
              <span className="font-semibold">{stats.today.profit_margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>هذا الأسبوع</span>
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">المبيعات:</span>
              <span className="font-semibold">{stats.this_week.sales_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الإيرادات:</span>
              <span className="font-semibold">{formatCurrency(stats.this_week.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الأرباح:</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.this_week.profit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">هامش الربح:</span>
              <span className="font-semibold">{stats.this_week.profit_margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>هذا الشهر</span>
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">المبيعات:</span>
              <span className="font-semibold">{stats.this_month.sales_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الإيرادات:</span>
              <span className="font-semibold">{formatCurrency(stats.this_month.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الأرباح:</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.this_month.profit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">هامش الربح:</span>
              <span className="font-semibold">{stats.this_month.profit_margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span>المنتجات الأكثر ربحاً</span>
            </h3>
            <Link
              to="/sales"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              عرض التفاصيل
            </Link>
          </div>

          {stats.top_products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد بيانات متاحة
            </div>
          ) : (
            <div className="space-y-4">
              {stats.top_products.slice(0, 5).map((product, index) => (
                <div key={`${product.product__type__name_ar}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{product.product__type__name_ar}</div>
                      {product.product__brand__name_ar && (
                        <div className="text-xs text-gray-500">{product.product__brand__name_ar}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-green-600 text-sm">
                      {formatCurrency(product.total_profit)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.total_quantity} قطعة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <LowStockAlerts />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">الإجراءات السريعة</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/sales/new"
            className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition duration-200 text-center"
          >
            <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">بيعة جديدة</div>
          </Link>
          
          <Link
            to="/sales/quick"
            className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition duration-200 text-center"
          >
            <Target className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">بيعة سريعة</div>
          </Link>
          
          <Link
            to="/sales"
            className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition duration-200 text-center"
          >
            <Users className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">إدارة المبيعات</div>
          </Link>
          
          <Link
            to="/inventory"
            className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 transition duration-200 text-center"
          >
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">إدارة المخزون</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;