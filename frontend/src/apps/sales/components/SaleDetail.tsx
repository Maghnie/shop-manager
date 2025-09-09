import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Edit, Trash2, CheckCircle, XCircle, Receipt, ArrowLeft, DollarSign } from 'lucide-react';
import { SalesService } from '@/apps/sales/services/saleService';
import { useSale } from '@/apps/sales/hooks/useSales';
import type { Sale } from '@/types/product';

const SaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const saleId = id ? parseInt(id) : 0;
  
  const { sale, loading, refetch } = useSale(saleId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showProfitDetails, setShowProfitDetails] = useState(true);

  const handleCompleteSale = async () => {
    if (!sale) return;
    
    setActionLoading('complete');
    try {
      const result = await SalesService.completeSale(sale.id!);
      alert(`${result.message}\nرقم الفاتورة: ${result.invoice_number}`);
      refetch();
    } catch (error) {
      alert('حدث خطأ أثناء إكمال البيعة');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSale = async () => {
    if (!sale) return;
    
    if (!confirm('هل أنت متأكد من إلغاء هذه البيعة؟ سيتم إرجاع المخزون.')) {
      return;
    }

    setActionLoading('cancel');
    try {
      const result = await SalesService.cancelSale(sale.id!);
      alert(result.message);
      refetch();
    } catch (error) {
      alert('حدث خطأ أثناء إلغاء البيعة');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSale = async () => {
    if (!sale) return;
    
    if (!confirm('هل أنت متأكد من حذف هذه البيعة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    setActionLoading('delete');
    try {
      await SalesService.deleteSale(sale.id!);
      alert('تم حذف البيعة بنجاح');
      navigate('/sales');
    } catch (error) {
      alert('حدث خطأ أثناء حذف البيعة');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      cash: 'نقدي',
      card: 'بطاقة',
      bank_transfer: 'تحويل بنكي',
      credit: 'آجل'
    };
    return methods[method as keyof typeof methods] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل تفاصيل البيعة...</div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">البيعة غير موجودة</div>
          <Link to="/sales" className="text-blue-600 hover:underline">
            العودة إلى قائمة المبيعات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center space-x-4 space-x-reverse mb-2">
            <h1 className="text-3xl font-bold text-gray-800">
              بيعة #{sale.sale_number}
            </h1>
            {getStatusBadge(sale.status)}
          </div>
          <p className="text-gray-600">
            تاريخ البيعة: {formatDate(sale.sale_date!)}
          </p>
        </div>

        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={() => navigate('/sales')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة</span>
          </button>

          {sale.status === 'pending' && (
            <>
              <Link
                to={`/sales/${sale.id}/edit`}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
              >
                <Edit className="w-4 h-4" />
                <span>تعديل</span>
              </Link>

              <button
                onClick={handleCompleteSale}
                disabled={actionLoading === 'complete'}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center space-x-2 space-x-reverse disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{actionLoading === 'complete' ? 'جاري الإكمال...' : 'إكمال البيعة'}</span>
              </button>

              <button
                onClick={handleCancelSale}
                disabled={actionLoading === 'cancel'}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 flex items-center space-x-2 space-x-reverse disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{actionLoading === 'cancel' ? 'جاري الإلغاء...' : 'إلغاء البيعة'}</span>
              </button>
            </>
          )}

          {sale.status === 'completed' && (
            <Link
              to={`/invoices/sale/${sale.id}`}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <Receipt className="w-4 h-4" />
              <span>عرض الفاتورة</span>
            </Link>
          )}

          {sale.status === 'cancelled' && (
            <button
              onClick={handleDeleteSale}
              disabled={actionLoading === 'delete'}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 flex items-center space-x-2 space-x-reverse disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{actionLoading === 'delete' ? 'جاري الحذف...' : 'حذف'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer and Sale Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">معلومات العميل</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">الاسم:</span>
              <span className="mr-2 font-medium">{sale.customer_name || 'عميل مباشر'}</span>
            </div>
            {sale.customer_phone && (
              <div>
                <span className="text-gray-600">رقم الهاتف:</span>
                <span className="mr-2 font-medium">{sale.customer_phone}</span>
              </div>
            )}
            {sale.customer_address && (
              <div>
                <span className="text-gray-600">العنوان:</span>
                <span className="mr-2 font-medium">{sale.customer_address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">تفاصيل البيعة</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">طريقة الدفع:</span>
              <span className="mr-2 font-medium">{getPaymentMethodText(sale.payment_method)}</span>
            </div>
            <div>
              <span className="text-gray-600">البائع:</span>
              <span className="mr-2 font-medium">{sale.created_by_name}</span>
            </div>
            <div>
              <span className="text-gray-600">تاريخ الإنشاء:</span>
              <span className="mr-2 font-medium">{formatDate(sale.created_at!)}</span>
            </div>
            {sale.notes && (
              <div>
                <span className="text-gray-600">ملاحظات:</span>
                <p className="mt-1 text-gray-800">{sale.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sale Items */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">المنتجات المباعة</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">المنتج</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">الكمية</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">سعر الوحدة</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">الإجمالي</th>
                {showProfitDetails && (
                  <>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 bg-green-100">الربح/الوحدة</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 bg-green-100">إجمالي الربح</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 bg-green-100">نسبة الربح</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{item.product_name_ar}</div>
                      {item.product_brand_ar && (
                        <div className="text-sm text-gray-500">{item.product_brand_ar}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                  <td className="py-3 px-4 text-center">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 px-4 text-center font-semibold">{formatCurrency(item.total_price!)}</td>
                  {showProfitDetails && (
                    <>
                      <td className="py-3 px-4 text-center text-green-600 font-medium bg-green-50">
                        {formatCurrency(item.profit_per_item!)}
                      </td>
                      <td className="py-3 px-4 text-center text-green-600 font-semibold bg-green-50">
                        {formatCurrency(item.total_profit!)}
                      </td>
                      <td className="py-3 px-4 text-center text-green-600 font-medium bg-green-50">
                        {item.profit_percentage!.toFixed(1)}%
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowProfitDetails(!showProfitDetails)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <DollarSign className="w-4 h-4" />
            <span>{showProfitDetails ? 'إخفاء' : 'عرض'} تفاصيل الربح</span>
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">الملخص المالي</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">المجموع الفرعي:</span>
              <span className="font-medium">{formatCurrency(sale.subtotal!)}</span>
            </div>
            {(sale.discount_amount || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">الخصم:</span>
                <span className="font-medium text-red-600">-{formatCurrency(sale.discount_amount!)}</span>
              </div>
            )}
            {(sale.tax_percentage || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">الضريبة ({sale.tax_percentage}%):</span>
                <span className="font-medium">+{formatCurrency(sale.tax_amount!)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>الإجمالي النهائي:</span>
              <span>{formatCurrency(sale.final_total!)}</span>
            </div>
          </div>
        </div>

        {showProfitDetails && (
          <div className="bg-green-50 rounded-xl shadow-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">تحليل الربح</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700">إجمالي التكلفة:</span>
                <span className="font-medium">{formatCurrency(sale.total_cost!)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">الربح الإجمالي:</span>
                <span className="font-medium">{formatCurrency(sale.gross_profit!)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">صافي الربح:</span>
                <span className="font-semibold text-green-600">{formatCurrency(sale.net_profit!)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3 border-green-300">
                <span className="text-green-800">نسبة الربح:</span>
                <span className="text-green-600">{sale.profit_percentage!.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleDetail;