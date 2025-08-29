// src/components/invoices/InvoicesList.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';
import { useInvoices } from '../../hooks/useInvoices';
import { InvoiceService } from '@/services/saleService';
import type { InvoiceListItem, Invoice } from '@/types/product';

const InvoicesList: React.FC = () => {
  const { invoices, loading } = useInvoices();
  const [filters, setFilters] = useState({
    search: '',
    is_printed: ''
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !filters.search || 
      invoice.invoice_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      (invoice.customer_name || '').toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  });

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-UK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل الفواتير...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">الفواتير</h1>
          <p className="text-gray-600">إجمالي الفواتير: {filteredInvoices.length}</p>
        </div>
        <Link
          to="/sales"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          العودة إلى المبيعات
        </Link>
      </div>

      {/* Simple Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="البحث في الفواتير..."
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Simple Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">رقم الفاتورة</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">التاريخ</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">العميل</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">الإجمالي</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">عرض</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد فواتير
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{invoice.invoice_number}</td>
                    <td className="py-4 px-6">{formatDate(invoice.invoice_date)}</td>
                    <td className="py-4 px-6">{invoice.customer_name || 'عميل مباشر'}</td>
                    <td className="py-4 px-6 text-center font-semibold">{formatCurrency(invoice.final_total)}</td>
                    <td className="py-4 px-6 text-center">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200 flex items-center gap-1 justify-center"
                      >
                        <Eye className="w-4 h-4" />
                        <span>عرض</span>
                      </Link>
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

export default InvoicesList;