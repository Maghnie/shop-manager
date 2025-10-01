import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Zap, Receipt } from 'lucide-react';
import { SalesService } from '@/apps/sales/services/saleService';
import { useAvailableProducts } from '@/apps/sales/hooks/useSales';
import type { SaleItem, QuickSaleResponse } from '@/types/product';

export const QuickSale: React.FC = () => {
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useAvailableProducts();
  
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'credit'>('cash');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [lastSaleResult, setLastSaleResult] = useState<QuickSaleResponse | null>(null);

  // Quick add popular products
  const popularProducts = products.slice(0, 12); // First 12 products as popular

  const addQuickProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItemIndex = items.findIndex(item => item.product === productId);
    
    if (existingItemIndex >= 0) {
      // Increase quantity if product already in cart
      const newItems = [...items];
      if (newItems[existingItemIndex].quantity < product.available_stock) {
        newItems[existingItemIndex].quantity += 1;
        setItems(newItems);
      }
    } else {
      // Add new item
      const newItem: SaleItem = {
        product: productId,
        quantity: 1,
        unit_price: product.selling_price
      };
      setItems([...items, newItem]);
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    const newItems = [...items];
    const product = products.find(p => p.id === newItems[index].product);
    
    if (product && quantity <= product.available_stock) {
      newItems[index].quantity = quantity;
      setItems(newItems);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setItems([]);
    setCustomerName('');
    setDiscount(0);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const finalTotal = subtotal - discount;

  const handleQuickSale = async () => {
    if (items.length === 0) {
      alert('يرجى إضافة منتجات للبيعة');
      return;
    }

    if (finalTotal <= 0) {
      alert('إجمالي البيعة يجب أن يكون أكبر من صفر');
      return;
    }

    setProcessing(true);
    try {
      const saleData = {
        customer_name: customerName,
        payment_method: paymentMethod,
        discount_amount: discount,
        tax_percentage: 0,
        items: items
      };

      const result = await SalesService.createQuickSale(saleData);
      setLastSaleResult(result);
      
      // Clear form
      clearCart();
      
      alert(`تم إكمال البيعة بنجاح!\nرقم البيعة: ${result.sale_number}\nرقم الفاتورة: ${result.invoice_number}\nالإجمالي: $${result.total.toFixed(2)}\nالربح: $${result.profit.toFixed(2)}`);
    } catch (error) {
      alert('حدث خطأ أثناء إتمام البيعة');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل المنتجات...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">بيعة سريعة</h1>
        <p className="text-gray-600">للعملاء المباشرين والمبيعات السريعة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Products Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">اختر المنتجات</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addQuickProduct(product.id)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800 text-sm">{product.id}</h3>
                  <span className="text-lg font-bold text-blue-600">${product.selling_price}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>المتوفر: {product.available_stock}</span>
                  {product.is_low_stock && (
                    <span className="text-red-500">⚠️ مخزون منخفض</span>
                  )}
                </div>
                
                <button className="w-full mt-3 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 space-x-reverse">
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>
            ))}
          </div>

          {popularProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا توجد منتجات متاحة حالياً
            </div>
          )}
        </div>

        {/* Cart and Checkout */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2 space-x-reverse">
              <ShoppingCart className="w-5 h-5" />
              <span>السلة ({items.length})</span>
            </h2>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                مسح الكل
              </button>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {items.map((item, index) => {
              const product = products.find(p => p.id === item.product);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{product?.id}</h4>
                    <p className="text-xs text-gray-500">${item.unit_price} × {item.quantity}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => updateItemQuantity(index, item.quantity - 1)}
                      className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    
                    <button
                      onClick={() => updateItemQuantity(index, item.quantity + 1)}
                      className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600"
                      disabled={product && item.quantity >= product.available_stock}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    <div className="ml-4 text-right">
                      <span className="font-semibold">${(item.quantity * item.unit_price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                السلة فارغة
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم العميل (اختياري)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="عميل مباشر"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  طريقة الدفع
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">نقدي</option>
                  <option value="card">بطاقة</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="credit">آجل</option>
                </select>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الخصم
                </label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>المجموع الفرعي:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>الخصم:</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleQuickSale}
                disabled={processing || finalTotal <= 0}
                className="w-full bg-green-500 text-white py-4 rounded-lg hover:bg-green-600 transition duration-200 flex items-center justify-center space-x-2 space-x-reverse font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5" />
                <span>{processing ? 'جاري المعالجة...' : 'إتمام البيعة السريعة'}</span>
              </button>
            </div>
          )}

          {/* Last Sale Result */}
          {lastSaleResult && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center space-x-2 space-x-reverse">
                <Receipt className="w-4 h-4" />
                <span>آخر بيعة مكتملة</span>
              </h3>
              <div className="text-sm space-y-1">
                <div>رقم البيعة: <span className="font-medium">{lastSaleResult.sale_number}</span></div>
                <div>رقم الفاتورة: <span className="font-medium">{lastSaleResult.invoice_number}</span></div>
                <div>الإجمالي: <span className="font-medium">${lastSaleResult.total.toFixed(2)}</span></div>
                <div>الربح: <span className="font-medium text-green-600">${lastSaleResult.profit.toFixed(2)}</span></div>
              </div>
              <div className="mt-2 flex space-x-2 space-x-reverse">
                <button
                  onClick={() => navigate(`/sales/${lastSaleResult.sale_id}`)}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  عرض البيعة
                </button>
                <button
                  onClick={() => navigate(`/invoices/${lastSaleResult.invoice_id}`)}
                  className="text-purple-600 hover:text-purple-800 text-sm underline"
                >
                  طباعة الفاتورة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/sales')}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-200"
        >
          العودة إلى قائمة المبيعات
        </button>
      </div>
    </div>
  );
};