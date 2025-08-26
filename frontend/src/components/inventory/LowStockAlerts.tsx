// src/components/inventory/LowStockAlerts.tsx

import React from 'react';
import { AlertTriangle, Package, RefreshCw, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLowStockAlert } from '@/hooks/useInventory';

const LowStockAlerts: React.FC = () => {
  const { lowStockItems, loading, refetch, count } = useLowStockAlert();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 space-x-reverse">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-800">تنبيهات المخزون المنخفض</h3>
          {count > 0 && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
              {count}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={refetch}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center space-x-1 space-x-reverse"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث</span>
          </button>
          
          <Link
            to="/inventory"
            className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition duration-200 flex items-center space-x-1 space-x-reverse"
          >
            <Eye className="w-4 h-4" />
            <span>عرض الكل</span>
          </Link>
        </div>
      </div>

      {count === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-800 mb-2">جميع المنتجات متوفرة</h4>
          <p className="text-gray-600">لا توجد تنبيهات مخزون في الوقت الحالي</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 space-x-reverse text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                يوجد {count} منتج بحاجة إلى إعادة تعبئة المخزون
              </span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 ${
                  item.is_out_of_stock
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                    <p className="text-sm text-gray-600">{item.product_type}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      آخر تحديث: {formatDate(item.last_updated)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      item.is_out_of_stock ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {item.quantity_in_stock}
                    </div>
                    <div className="text-xs text-gray-500">
                      الحد الأدنى: {item.minimum_stock_level}
                    </div>
                    
                    <div className="mt-2">
                      {item.is_out_of_stock ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 space-x-reverse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>نفد المخزون</span>
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 space-x-reverse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>مخزون منخفض</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-4">
            <div className="flex space-x-2 space-x-reverse">
              <Link
                to="/inventory?stock_status=low_stock"
                className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition duration-200 text-center"
              >
                إدارة المخزون المنخفض
              </Link>
              <Link
                to="/inventory?stock_status=out_of_stock"
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200 text-center"
              >
                عرض المنتجات المنتهية
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;