import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Sale {
  id: number;
  sale_number: string;
  sale_date: string;
  customer_name: string;
  payment_method: string;
  status: string;
  created_by_name: string;
  items_count: number;
  final_total: number;
  net_profit: number;
  profit_percentage: number;
}

export const SalesList: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment_method: '',
    date_from: '',
    date_to: ''
  });

  const [dateError, setDateError] = useState('');
  
  const validateDateRange = (fromDate: string, toDate: string) => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setDateError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleDateFromChange = (value: string) => {
    setFilters(prev => ({ ...prev, date_from: value }));
    validateDateRange(value, filters.date_to);
  };

  const handleDateToChange = (value: string) => {
    setFilters(prev => ({ ...prev, date_to: value }));
    validateDateRange(filters.date_from, value);
  };

  useEffect(() => {
    fetchSales();
  }, [filters]);

  const fetchSales = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.payment_method) params.append('payment_method', filters.payment_method);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      
      const response = await axios.get(`inventory/sales/?${params.toString()}`);
      setSales(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    const statusText = {
      completed: 'مكتمل',
      pending: 'معلق',
      cancelled: 'ملغي'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    
    const matchesFromDate = !filters.date_from || 
      saleDate >= new Date(filters.date_from);
    
    const matchesToDate = !filters.date_to || 
      saleDate <= new Date(filters.date_to + 'T23:59:59');
    
    return matchesFromDate && matchesToDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل المبيعات...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">إدارة المبيعات</h1>
          <p className="text-gray-600">
            إجمالي المبيعات: {filteredSales.length}
          </p>
        </div>
        <div className="flex space-x-4 space-x-reverse">
          <Link
            to="/sales/new"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold"
          >
            بيعة جديدة +
          </Link>
          <Link
            to="/sales/quick"
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition duration-200 font-semibold"
          >
            بيعة سريعة
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">البحث والتصفية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البحث
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="رقم البيعة أو اسم العميل..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحالة
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الحالات</option>
              <option value="completed">مكتمل</option>
              <option value="pending">معلق</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              طريقة الدفع
            </label>
            <select
              value={filters.payment_method}
              onChange={(e) => handleFilterChange('payment_method', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الطرق</option>
              <option value="cash">نقدي</option>
              <option value="card">بطاقة</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="credit">آجل</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                dateError ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleDateToChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                dateError ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {dateError && (
              <p className="text-red-500 text-sm mt-1">{dateError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">رقم البيعة</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">التاريخ</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">العميل</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">البائع</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">عدد المنتجات</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">طريقة الدفع</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">الإجمالي</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700 bg-green-100">الربح</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">نسبة الربح</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">الحالة</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    لا توجد مبيعات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{sale.sale_number}</td>
                    <td className="py-4 px-6">{formatDate(sale.sale_date)}</td>
                    <td className="py-4 px-6">{sale.customer_name || 'عميل مباشر'}</td>
                    <td className="py-4 px-6">{sale.created_by_name}</td>
                    <td className="py-4 px-6">{sale.items_count}</td>
                    <td className="py-4 px-6">
                      {sale.payment_method === 'cash' && 'نقدي'}
                      {sale.payment_method === 'card' && 'بطاقة'}
                      {sale.payment_method === 'bank_transfer' && 'تحويل بنكي'}
                      {sale.payment_method === 'credit' && 'آجل'}
                    </td>
                    <td className="py-4 px-6 font-semibold">{formatCurrency(sale.final_total)}</td>
                    <td className="py-4 px-6 text-green-600 font-semibold bg-green-50">
                      {formatCurrency(sale.net_profit)}
                    </td>
                    <td className="py-4 px-6 text-green-600 font-semibold">
                      {sale.profit_percentage.toFixed(1)}%
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center space-x-2 space-x-reverse">
                        <Link
                          to={`/sales/${sale.id}`}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200"
                        >
                          عرض
                        </Link>
                        <Link
                          to={`/invoices/sale/${sale.id}`}
                          className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition duration-200"
                        >
                          فاتورة
                        </Link>
                        {sale.status === 'pending' && (
                          <button
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-200"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
