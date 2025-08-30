import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Minus, Save, X, Calculator } from 'lucide-react';
import { SalesService } from '@/services/saleService';
import { useAvailableProducts, useSale } from '@/hooks/useSales';
import { useSalesCalculations } from '@/hooks/useSalesCalculations'
import type { Sale, SaleItem } from '@/types/product';

const SaleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const { products, loading: productsLoading } = useAvailableProducts();
  const { sale, loading: saleLoading } = useSale(id ? parseInt(id) : undefined);
  
  const [formData, setFormData] = useState<Partial<Sale>>({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    payment_method: 'cash',
    discount_amount: 0,
    tax_percentage: 0,
    notes: '',
    items: []
  });
  
  const [saving, setSaving] = useState(false);
  const [showProfitInfo, setShowProfitInfo] = useState(true);

  // Load sale data when editing
  useEffect(() => {
    if (isEditing && sale) {
      setFormData(sale);
    }
  }, [isEditing, sale]);

  // Calculate totals
  const { 
    subtotal, 
    totalCost, 
    discountAmount, 
    taxAmount, 
    finalTotal, 
    netProfit, 
    profitPercentage 
    } = useSalesCalculations(formData, products);

  const handleInputChange = (field: keyof Sale, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: SaleItem = {
      product: 0,
      quantity: 1,
      unit_price: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ) || []
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || []
    }));
  };

  const handleProductSelect = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateItem(index, 'product', productId);
      updateItem(index, 'unit_price', product.selling_price);
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.items?.length) {
      errors.push('يجب إضافة منتج واحد على الأقل');
    }
    
    formData.items?.forEach((item, index) => {
      if (!item.product) {
        errors.push(`يجب اختيار منتج للعنصر ${index + 1}`);
      }
      if (item.quantity <= 0) {
        errors.push(`كمية العنصر ${index + 1} يجب أن تكون أكبر من صفر`);
      }
      if (item.unit_price <= 0) {
        errors.push(`سعر العنصر ${index + 1} يجب أن يكون أكبر من صفر`);
      }
      
      const product = products.find(p => p.id === item.product);
      if (product && item.quantity > product.available_stock) {
        errors.push(`الكمية المطلوبة للمنتج ${product.type_name_ar} تتجاوز المخزون المتاح (${product.available_stock})`);
      }
    });
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await SalesService.updateSale(parseInt(id), formData);
        alert('تم تحديث البيعة بنجاح');
      } else {
        const newSale = await SalesService.createSale(formData);
        alert('تم إنشاء البيعة بنجاح');
        navigate(`/sales/${newSale.id}`);
      }
    } catch (error) {
      alert('حدث خطأ أثناء حفظ البيعة');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (productsLoading || (isEditing && saleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? 'تعديل البيعة' : 'بيعة جديدة'}
          </h1>
          <div className="flex space-x-4 space-x-reverse">
            <button
              type="button"
              onClick={() => setShowProfitInfo(!showProfitInfo)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <Calculator className="w-4 h-4" />
              <span>{showProfitInfo ? 'إخفاء' : 'عرض'} معلومات الربح</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم العميل
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اختياري - للعملاء المباشرين"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اختياري"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <textarea
                value={formData.customer_address}
                onChange={(e) => handleInputChange('customer_address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="اختياري"
              />
            </div>
          </div>

          {/* Payment and Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة الدفع *
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="cash">نقدي</option>
                <option value="card">بطاقة</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="credit">آجل</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مبلغ الخصم
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => handleInputChange('discount_amount', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نسبة الضريبة (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.tax_percentage}
                onChange={(e) => handleInputChange('tax_percentage', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sale Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">المنتجات</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.items?.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المنتج *
                      </label>
                      <select
                        value={item.product}
                        onChange={(e) => handleProductSelect(index, parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value={0}>اختر منتج...</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id} disabled={product.available_stock === 0}>
                            {product.type_name_ar} - المتوفر: {product.available_stock}
                            {product.is_low_stock && ' ⚠️'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الكمية *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        سعر الوحدة *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 mb-2">الإجمالي</span>
                      <div className="font-semibold text-lg">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition duration-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Product Stock Warning */}
                  {item.product > 0 && (() => {
                    const product = products.find(p => p.id === item.product);
                    return product && item.quantity > product.available_stock && (
                      <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
                        ⚠️ الكمية المطلوبة ({item.quantity}) تتجاوز المخزون المتاح ({product.available_stock})
                      </div>
                    );
                  })()}
                </div>
              ))}

              {(!formData.items || formData.items.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  لا توجد منتجات مضافة. اضغط "إضافة منتج" لبدء البيعة.
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {formData.items && formData.items.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ملخص البيعة</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الخصم:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>+${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>الإجمالي النهائي:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {showProfitInfo && products.length > 0 && (
                  <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">معلومات الربح (للبائع فقط)</h4>
                    <div className="flex justify-between text-sm">
                      <span>إجمالي التكلفة:</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>صافي الربح:</span>
                      <span className="text-green-600 font-semibold">{formatCurrency(netProfit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>نسبة الربح:</span>
                      <span className="text-green-600 font-semibold">{profitPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 space-x-reverse">
            <button
              type="button"
              onClick={() => navigate('/sales')}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <X className="w-4 h-4" />
              <span>إلغاء</span>
            </button>
            <button
              type="submit"
              disabled={saving || !formData.items?.length}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : (isEditing ? 'تحديث البيعة' : 'حفظ البيعة')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleForm;