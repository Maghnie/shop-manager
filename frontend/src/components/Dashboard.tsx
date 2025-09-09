// src/components/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  PlusCircle,
  ClipboardList,
  BarChart3,
  Zap,
  Receipt,
  Archive,
  AlertTriangle
} from 'lucide-react';

// Import the new components
import LowStockAlerts from './inventory/LowStockAlerts';
import { useSalesStats } from '@/apps/sales/hooks/useSales';
import { useLowStockAlert } from '@/hooks/useInventory';

const Dashboard: React.FC = () => {
  const { stats: salesStats, loading: salesLoading } = useSalesStats();
  const { count: lowStockCount } = useLowStockAlert();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for other dashboard data
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  if (loading && salesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">لوحة التحكم</h1>
        <p className="text-gray-600">نظرة شاملة على المخزون والمبيعات والأرباح</p>
      </header>

      {/* Stats Overview */}
      {salesStats && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="إجمالي المبيعات اليوم"
            value={salesStats.today.sales_count.toString()}
            subtitle={`الإيرادات: ${formatCurrency(salesStats.today.revenue)}`}
            icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
            bg="bg-blue-100"
            border="border-blue-500"
          />
          <StatCard
            title="الأرباح اليوم"
            value={formatCurrency(salesStats.today.profit)}
            subtitle={`هامش: ${salesStats.today.profit_margin.toFixed(1)}%`}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            bg="bg-green-100"
            border="border-green-500"
          />
          <StatCard
            title="إجمالي المبيعات الشهر"
            value={salesStats.this_month.sales_count.toString()}
            subtitle={`الإيرادات: ${formatCurrency(salesStats.this_month.revenue)}`}
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            bg="bg-purple-100"
            border="border-purple-500"
          />
          <StatCard
            title="تنبيهات المخزون"
            value={lowStockCount.toString()}
            subtitle="منتجات بحاجة لإعادة تعبئة"
            icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
            bg="bg-orange-100"
            border="border-orange-500"
          />
        </section>
      )}

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Sales Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            المبيعات
          </h3>
          <div className="space-y-3">
            <Link
              to="/sales/quick"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition duration-200 flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              <span>بيعة سريعة</span>
            </Link>
            <Link
              to="/sales/new"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>بيعة جديدة</span>
            </Link>
            <Link
              to="/sales"
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition duration-200 flex items-center gap-2"
            >
              <ClipboardList className="w-5 h-5" />
              <span>إدارة المبيعات</span>
            </Link>
          </div>
        </div>

        {/* Product Management */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-600" />
            المنتجات
          </h3>
          <div className="space-y-3">
            <Link
              to="/products/new"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:scale-105 transition-transform duration-200 flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>إضافة منتج جديد</span>
            </Link>
            <Link
              to="/products"
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-teal-600 hover:to-teal-700 transition duration-200 flex items-center gap-2"
            >
              <ClipboardList className="w-5 h-5" />
              <span>إدارة المنتجات</span>
            </Link>
            <Link
              to="/inventory"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition duration-200 flex items-center gap-2"
            >
              <Archive className="w-5 h-5" />
              <span>إدارة المخزون</span>
            </Link>
          </div>
        </div>

        {/* Reports & Analytics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            التقارير والتحليلات
          </h3>
          <div className="space-y-3">
            <Link
              to="/sales/dashboard"
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition duration-200 flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span>لوحة المبيعات</span>
            </Link>
            <Link
              to="/invoices"
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition duration-200 flex items-center gap-2"
            >
              <Receipt className="w-5 h-5" />
              <span>الفواتير</span>
            </Link>
            <Link
              to="/reports"
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg hover:from-red-600 hover:to-red-700 transition duration-200 flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span>تقارير مفصلة</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <LowStockAlerts />

        {/* Quick Stats */}
        {salesStats && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">إحصائيات سريعة</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">مبيعات هذا الأسبوع:</span>
                <span className="font-bold text-lg">{salesStats.this_week.sales_count}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-600">أرباح هذا الأسبوع:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatCurrency(salesStats.this_week.profit)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600">إجمالي المبيعات:</span>
                <span className="font-bold text-lg text-blue-600">
                  {salesStats.overview.total_sales}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-600">إجمالي الأرباح:</span>
                <span className="font-bold text-lg text-purple-600">
                  {formatCurrency(salesStats.overview.total_profit)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, bg, border }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 border-r-4 ${border}`}>
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${bg} ml-4`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

export default Dashboard;