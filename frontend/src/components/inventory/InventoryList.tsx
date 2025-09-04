import React, { useState } from 'react';
import { AlertTriangle, Package, Edit2, Search, Filter, Save, X } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import type { Inventory } from '@/types/product';

const InventoryList: React.FC = () => {
  const { inventory, loading, error, refetch, updateItem, setInventory} = useInventory();
  const [filters, setFilters] = useState({
    search: '',
    stock_status: '', // all, low_stock, out_of_stock
    sort_by: 'quantity_in_stock' // quantity_in_stock, product_name, last_updated
  });
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({
    quantity_in_stock: 0,
    minimum_stock_level: 0
  });

  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = !filters.search || 
        item.product_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.product_type.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.stock_status || 
        (filters.stock_status === 'low_stock' ? item.is_low_stock : 
         filters.stock_status === 'out_of_stock' ? item.is_out_of_stock : true);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (filters.sort_by) {
        case 'quantity_in_stock':
          return a.quantity_in_stock - b.quantity_in_stock;
        case 'product_name':
          return a.product_name.localeCompare(b.product_name);
        case 'last_updated':
          return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
        default:
          return 0;
      }
    });

  const lowStockCount = inventory.filter(item => item.is_low_stock).length;
  const outOfStockCount = inventory.filter(item => item.is_out_of_stock).length;

  const handleEditStart = (item: Inventory) => {
    setEditingItem(item.id);
    setEditValues({
      quantity_in_stock: item.quantity_in_stock,
      minimum_stock_level: item.minimum_stock_level
    });
  };

  const handleEditSave = async (itemId: number) => {
    try {
      await updateItem(itemId, editValues);
      setEditingItem(null);
      alert('تم تحديث المخزون بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء تحديث المخزون');
      console.error(error);
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditValues({ quantity_in_stock: 0, minimum_stock_level: 0 });
  };

  const getStockStatus = (item: Inventory) => {
    if (item.is_out_of_stock) {
      return (
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 space-x-reverse">
          <AlertTriangle className="w-3 h-3" />
          <span>نفد المخزون</span>
        </span>
      );
    }
    if (item.is_low_stock) {
      return (
        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 space-x-reverse">
          <AlertTriangle className="w-3 h-3" />
          <span>مخزون منخفض</span>
        </span>
      );
    }
    return (
      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
        متوفر
      </span>
    );
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل المخزون...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with alerts */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">إدارة المخزون</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">إجمالي المنتجات</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{inventory.length}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">مخزون منخفض</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-600">نفد المخزون</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2 space-x-reverse">
          <Filter className="w-5 h-5" />
          <span>البحث والتصفية</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="اسم المنتج أو النوع..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة المخزون</label>
            <select
              value={filters.stock_status}
              onChange={(e) => setFilters(prev => ({ ...prev, stock_status: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع المنتجات</option>
              <option value="low_stock">مخزون منخفض</option>
              <option value="out_of_stock">نفد المخزون</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب حسب</label>
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="quantity_in_stock">الكمية المتوفرة</option>
              <option value="product_name">اسم المنتج</option>
              <option value="last_updated">آخر تحديث</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">المنتج</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">الكمية المتوفرة</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">الحد الأدنى</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">الحالة</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">آخر تحديث</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد منتجات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-500">{item.product_type}</div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editValues.quantity_in_stock}
                          onChange={(e) => setEditValues(prev => ({ ...prev, quantity_in_stock: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className={`font-semibold ${item.is_out_of_stock ? 'text-red-600' : item.is_low_stock ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.quantity_in_stock}
                        </span>
                      )}
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editValues.minimum_stock_level}
                          onChange={(e) => setEditValues(prev => ({ ...prev, minimum_stock_level: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span>{item.minimum_stock_level}</span>
                      )}
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      {getStockStatus(item)}
                    </td>
                    
                    <td className="py-4 px-6 text-center text-sm text-gray-500">
                      {formatDate(item.last_updated)}
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex justify-center space-x-2 space-x-reverse">
                        {editingItem === item.id ? (
                          <>
                            <button
                              onClick={() => handleEditSave(item.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition duration-200 flex items-center space-x-1 space-x-reverse"
                            >
                              <Save className="w-4 h-4" />
                              <span>حفظ</span>
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition duration-200 flex items-center space-x-1 space-x-reverse"
                            >
                              <X className="w-4 h-4" />
                              <span>إلغاء</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditStart(item)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200 flex items-center space-x-1 space-x-reverse"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>تعديل</span>
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

export default InventoryList;