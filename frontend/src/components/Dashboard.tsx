// src/components/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  PackageSearch,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  PlusCircle,
  ClipboardList,
  BarChart3,
  Zap,
  Receipt,
  Archive,
  AlertTriangle,
  CloudSun,
  Sun,
  CloudMoon
} from 'lucide-react';

// Import the new components
import { LowStockAlerts } from '@/apps/inventory/';
import { useSalesStats } from '@/apps/sales/hooks/useSales';
import { useLowStockAlert } from '@/apps/inventory/hooks/useInventory';

const Dashboard: React.FC = () => {
  const { stats: salesStats, loading: salesLoading } = useSalesStats();
  const { count: lowStockCount } = useLowStockAlert();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Simulate loading for other dashboard data
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getTimeOfDayIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 12) {
      return <CloudSun className="w-6 h-6 text-orange-500" />;
    } else if (hour >= 12 && hour < 18) {
      return <Sun className="w-6 h-6 text-yellow-500" />;
    } else {
      return <CloudMoon className="w-6 h-6 text-blue-500" />;
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 12) {
      return 'صباح الخير';
    } else if (hour >= 12 && hour < 18) {
      return 'نهارك سعيد';
    } else {
      return 'مساء الخير';
    }
  };

  const AnalogClock: React.FC = () => {
    const hour = currentTime.getHours() % 12;
    const minute = currentTime.getMinutes();
    const second = currentTime.getSeconds();

    // Calculate angles for hands
    const hourAngle = (hour * 30) + (minute * 0.5); // 30 degrees per hour + minute adjustment
    const minuteAngle = minute * 6; // 6 degrees per minute
    const secondAngle = second * 6; // 6 degrees per second

    return (
      <div className="relative">
        <svg width="48" height="48" className="drop-shadow-sm">
          {/* Clock face */}
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="white"
            stroke="#3B82F6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* Hour markers */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => {
            const angle = hour * 30;
            const isMainHour = hour % 3 === 0;
            const outerRadius = 22;
            const innerRadius = isMainHour ? 16 : 18;

            const x1 = 24 + Math.sin((angle * Math.PI) / 180) * outerRadius;
            const y1 = 24 - Math.cos((angle * Math.PI) / 180) * outerRadius;
            const x2 = 24 + Math.sin((angle * Math.PI) / 180) * innerRadius;
            const y2 = 24 - Math.cos((angle * Math.PI) / 180) * innerRadius;

            return (
              <line
                key={hour}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#374151"
                strokeWidth={isMainHour ? "2" : "1"}
              />
            );
          })}

          {/* Hour hand */}
          <line
            x1="24"
            y1="24"
            x2={24 + Math.sin((hourAngle * Math.PI) / 180) * 12}
            y2={24 - Math.cos((hourAngle * Math.PI) / 180) * 12}
            stroke="#1E40AF"
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-transform duration-1000"
          />

          {/* Minute hand */}
          <line
            x1="24"
            y1="24"
            x2={24 + Math.sin((minuteAngle * Math.PI) / 180) * 18}
            y2={24 - Math.cos((minuteAngle * Math.PI) / 180) * 18}
            stroke="#DC2626"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-transform duration-1000"
          />

          {/* Center dot */}
          <circle cx="24" cy="24" r="2" fill="#374151" />
        </svg>

        {/* Digital time tooltip on hover */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {currentTime.toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>
    );
  };

  if (loading && salesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-10 text-center">
        {/* Beautiful Date & Time Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-3 mb-6 border border-blue-100">
          <div className="flex items-center justify-between px-4">
            {/* Greeting */}
            <div className="flex items-center gap-3">
              {getTimeOfDayIcon()}
              <span className="text-xl font-medium text-blue-300">{getTimeOfDayGreeting()}</span>
            </div>

            {/* Date */}
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">
                {currentTime.toLocaleDateString('ar-EG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Analog Clock */}
            <div className="flex items-center gap-3 group">
              <span className="text-lg text-blue-300">الساعة</span>
              <AnalogClock />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-2">لوحة التحكم</h1>
        <p className="text-gray-600">نظرة شاملة على المخزون والمبيعات والأرباح</p>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Stats and Quick Actions - Right Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Overview */}
          {salesStats && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </section>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">الإجراءات السريعة</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/sales/new"
                className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition duration-200 text-center"
              >
                <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">بيعة جديدة</div>
              </Link>

              <Link
                to="/products"
                className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition duration-200 text-center"
              >
                <PackageSearch className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">معلومات المنتجات</div>
              </Link>

              <Link
                to="/invoices"
                className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition duration-200 text-center"
              >
                <Receipt className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">الفواتير</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts - Left Column */}
        <div className="lg:col-span-1">
          <LowStockAlerts />
        </div>
        
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