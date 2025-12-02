import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Settings, Plus, Minus, Trash2 } from 'lucide-react';
import { SalesService } from '@/apps/sales/services/saleService';
import { useAvailableProducts, useSale } from '@/apps/sales/hooks/useSales';
import { useSalesCalculations } from '@/apps/sales/hooks/useSalesCalculations';
import { ProductInput, SaleSummary} from '@/apps/sales/components';
import type { Sale, SaleItem } from '@/types/product';
import toast from 'react-hot-toast';


export const SaleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const { products, loading: productsLoading } = useAvailableProducts();
  const { sale, loading: saleLoading } = useSale(id ? parseInt(id) : undefined);
  
  const [showOptionalInfo, setShowOptionalInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  
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

  // Load sale data when editing
  useEffect(() => {
    if (isEditing && sale) {
      setFormData(sale);
    }
  }, [isEditing, sale]);

  // Calculate totals using the existing hook
  const { 
    subtotal, 
    totalCost, 
    discountAmount, 
    taxAmount, 
    finalTotal, 
    netProfit, 
    profitMargin,
    profitPercentage 
  } = useSalesCalculations(formData, products);

  // Event Handlers
  const handleInputChange = (field: keyof Sale, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerUpdate = (field: keyof Pick<Sale, 'customer_name' | 'customer_phone' | 'customer_address'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateAndCapQuantity = useCallback((
    productId: number, 
    requestedQuantity: number, 
    showWarning: boolean = true
    ): { quantity: number; wasReduced: boolean } => {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        return { quantity: 0, wasReduced: false };
    }
    
    const maxQuantity = product.available_stock;
    const finalQuantity = Math.min(requestedQuantity, maxQuantity);
    const wasReduced = finalQuantity < requestedQuantity;
    
    if (wasReduced && showWarning) {
        alert(`⚠ الكمية المطلوبة (${requestedQuantity}) تتجاوز المخزون المتاح (${maxQuantity})` +
             `\n تم تقليل الكمية إلى الحد الأقصى المتاح: ${finalQuantity}`);
    }
    
    return { quantity: finalQuantity, wasReduced };
  }, [products]);

  const addProductToSale = useCallback((productId: number, quantity: number = 1) => {
    const product = products.find(p => p.id === productId);    
    if (!product) return;
    console.log("before creating saleitem, cost price: ", product.cost_price)
    console.log("before creating saleitem, selling price: ", product.selling_price)


    const existingItemIndex = formData.items?.findIndex(item => item.product === productId);
    
    if (existingItemIndex !== undefined && existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...(formData.items || [])];
      const currentQuantity = updatedItems[existingItemIndex].quantity;
      const requestedTotal = currentQuantity + quantity;
        
      const { quantity: finalQuantity } = validateAndCapQuantity(productId, requestedTotal);
    
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: finalQuantity
      };
      setFormData(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      const { quantity: finalQuantity } = validateAndCapQuantity(productId, quantity);
    
      const newItem: SaleItem = {
        product: productId,
        quantity: finalQuantity,
        unit_price: product.selling_price,
        cost_price: product.cost_price
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }));
    }
  }, [formData.items, products, validateAndCapQuantity]);

  const updateItemQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    const productId = formData.items?.[index]?.product;
    if (!productId) return;

    const { quantity: finalQuantity } = validateAndCapQuantity(productId, quantity);

    setFormData(prev => ({
      ...prev,
      items: prev.items?.map((item, i) =>
        i === index ? { ...item, quantity: finalQuantity } : item
      ) || []
    }));
  }, [[products, formData.items, validateAndCapQuantity]]);

  const removeItem = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const clearAllItems = useCallback(() => {
    setFormData(prev => ({ ...prev, items: [] }));
  }, []);

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
        toast.success('تم تحديث البيعة بنجاح');
      } else {
        const newSale = await SalesService.createSale(formData);
        toast.success('تم إنشاء البيعة بنجاح');
        navigate(`/sales/${newSale.id}`);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ البيعة');
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? 'تعديل البيعة' : 'بيعة جديدة'}
          </h1>
          <div className="flex space-x-4 space-x-reverse">
            <button
              type="button"
              onClick={() => setShowOptionalInfo(!showOptionalInfo)}
              className="bg-blue-300 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <Settings className="w-4 h-4" />
              <span>{showOptionalInfo ? 'إخفاء' : 'عرض'} المعلومات الاختيارية</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Product Selection */}
            <div className="space-y-6">
              {/* Product Combobox */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">إضافة المنتجات</h3>
                <ProductInput
                  products={products}
                  onAddProduct={addProductToSale}
                />
              </div>

              {/* Quick Product Selection Buttons */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">اختيار سريع</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.slice(0, 10).map(product => (
                    <div
                      key={product.id}
                      onClick={() => addProductToSale(product.id, 1)}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-sm">{product.type_name_ar}</h4>
                          <p className="text-xs text-gray-500">{product.brand_name_ar} - رقم {product.id}</p>
                        </div>
                        <span className="text-sm font-bold text-blue-600">${product.selling_price}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                        <span>المتوفر: {product.available_stock}</span>
                        {product.is_low_stock && (
                          <span className="text-red-500">⚠️</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="w-full bg-blue-500 text-white py-1.5 rounded hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1 space-x-reverse text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>إضافة</span>
                      </button>
                    </div>
                  ))}
                </div>
                {products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد منتجات متاحة
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Basket and Summary */}
            <div className="space-y-6">
              {/* Basket */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">السلة ({formData.items?.length || 0})</h3>
                  {formData.items && formData.items.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllItems}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center space-x-1 space-x-reverse"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>مسح الكل</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {formData.items && formData.items.length > 0 ? (
                    formData.items.map((item, index) => {
                      const product = products.find(p => p.id === item.product);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{product?.type_name_ar} {product?.brand_name_ar} - رقم {product?.id}</h4>
                            <p className="text-xs text-gray-500">${item.unit_price} × {item.quantity}</p>
                          </div>

                          <div className="flex items-center space-x-2 space-x-reverse ml-2">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                              className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <span className="w-8 text-center font-medium">{item.quantity}</span>

                            <button
                              type="button"
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                              disabled={product && item.quantity >= product.available_stock}
                            >
                              <Plus className="w-4 h-4" />
                            </button>

                            <div className="ml-4 text-right min-w-[80px]">
                              <span className="font-semibold text-sm">${(item.quantity * item.unit_price).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">السلة فارغة</p>
                      <p className="text-sm mt-2">ابدأ بإضافة المنتجات</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">ملخص البيعة</h3>
                {formData.items && formData.items.length > 0 ? (
                  <SaleSummary
                    subtotal={subtotal}
                    discountAmount={discountAmount}
                    taxAmount={taxAmount}
                    finalTotal={finalTotal}
                    totalCost={totalCost}
                    netProfit={netProfit}
                    profitMargin={profitMargin}
                    profitPercentage={profitPercentage}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">سيظهر ملخص البيعة عند إضافة المنتجات</p>
                  </div>
                )}
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
            </div>
          </div>

          {/* Optional Information Section */}
          {showOptionalInfo && (
            <div className="bg-gray-50 rounded-lg p-8 space-y-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">المعلومات الاختيارية</h3>

              {/* Payment and Settings */}
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-4">إعدادات الدفع والخصومات</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-4">معلومات العميل</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم العميل
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name || ''}
                      onChange={(e) => handleCustomerUpdate('customer_name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="اسم العميل"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone || ''}
                      onChange={(e) => handleCustomerUpdate('customer_phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="رقم الهاتف"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العنوان
                    </label>
                    <input
                      type="text"
                      value={formData.customer_address || ''}
                      onChange={(e) => handleCustomerUpdate('customer_address', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="العنوان"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-4">ملاحظات</h4>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};