import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  DollarSign,
  TrendingUp,
  Trophy,
  PlusCircle,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

type Summary = {
  avg_profit_usd: number;
  avg_profit_pct: number;
  max_profit_usd: number;
};

type Stats = {
  total_products: number;
  summary: Summary;
};

type Product = {
  id: number;
  type_name_ar: string;
  brand_name_ar: string | null;
  cost_price: number;
  selling_price: number;
  profit: number;
  profit_percentage: number;
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [reportsResponse, productsResponse] = await Promise.all([
          axios.get('reports/'),
          axios.get('inventory/products/'),
        ]);
        setStats(reportsResponse.data);
        setRecentProducts(productsResponse.data.results);     
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {        
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : num.toFixed(2);
  };

  if (loading) {
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
        <p className="text-gray-600">نظرة عامة على المخزون والأرباح</p>
      </header>

      {/* Stats */}
      {/* {stats && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="إجمالي المنتجات"
            value={stats.total_products.toString()}
            icon={<PackageCheck className="w-6 h-6 text-blue-600" />}
            bg="bg-blue-100"
            border="border-blue-500"
          />
          <StatCard
            title="متوسط الربح"
            value={formatCurrency(stats.summary.avg_profit_usd)}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            bg="bg-green-100"
            border="border-green-500"
          />
          <StatCard
            title="متوسط نسبة الربح"
            value={`${stats.summary.avg_profit_pct.toFixed(1)}%`}
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            bg="bg-purple-100"
            border="border-purple-500"
          />
          <StatCard
            title="أعلى ربح"
            value={formatCurrency(stats.summary.max_profit_usd)}
            icon={<Trophy className="w-6 h-6 text-orange-600" />}
            bg="bg-orange-100"
            border="border-orange-500"
          />
        </section>
      )} */}

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <QuickAction
          title="إضافة منتج جديد"
          to="/products/new"
          icon={<PlusCircle className="w-8 h-8 mx-auto mb-4" />}
          text="أضف منتجاً جديداً إلى المخزون"
          gradient="from-blue-500 to-purple-600"
        />
        <QuickAction
          title="إدارة المنتجات"
          to="/products" 
          icon={<ClipboardList className="w-8 h-8 mx-auto mb-4" />}
          text="عرض وتحرير المنتجات الموجودة"
          gradient="from-green-500 to-teal-600"
        />
        <QuickAction
          title="التقارير والتحليلات"
          to="/reports"
          icon={<BarChart3 className="w-8 h-8 mx-auto mb-4" />}
          text="عرض تقارير الأرباح والإحصائيات"
          gradient="from-orange-500 to-red-600"
        />
      </section>
       
      {/* Recent Products */}
      {/* {recentProducts.length > 0 && (
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">المنتجات المضافة حديثاً</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm rtl">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-right">
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">العلامة التجارية</th>
                  <th className="py-3 px-4">سعر التكلفة</th>
                  <th className="py-3 px-4">سعر البيع</th>
                  <th className="py-3 px-4">الربح</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50 text-right">
                    <td className="py-3 px-4">{product.type_name_ar}</td>
                    <td className="py-3 px-4">{product.brand_name_ar || 'غير محدد'}</td>
                    <td className="py-3 px-4">{formatCurrency(product.cost_price)}</td>
                    <td className="py-3 px-4">{formatCurrency(product.selling_price)}</td>
                    <td className="py-3 px-4 text-green-600 font-semibold">
                      {formatCurrency(product.profit)} ({product.profit_percentage.toFixed(1)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )} */}
    </div>
  );
};

export default Dashboard;

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bg, border }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 border-r-4 ${border}`}>
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${bg} ml-4`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

type QuickActionProps = {
  title: string;
  text: string;
  to: string;
  icon: React.ReactNode;
  gradient: string;
};

const QuickAction: React.FC<QuickActionProps> = ({ title, text, to, icon, gradient }) => (
  <Link
    to={to}
    className={`bg-gradient-to-r ${gradient} text-white rounded-xl shadow-lg p-6 text-center hover:scale-105 transition-transform duration-300`}
  >
    {icon}
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-sm text-white/80">{text}</p>
  </Link>
);
