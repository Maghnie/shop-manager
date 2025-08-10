import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    type: '',
    brand: '',
    cost_price: '',
    selling_price: '',
    size: '',
    weight: '',
    material: '',
    tags: ''
  });

  const [options, setOptions] = useState({
    productTypes: [],
    brands: [],
    materials: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchOptions();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchOptions = async () => {
    try {
      const [typesRes, brandsRes, materialsRes] = await Promise.all([
        axios.get('/inventory/product-types/'),
        axios.get('/inventory/brands/'),
        axios.get('/inventory/materials/')
      ]);

      setOptions({
        productTypes: typesRes.data.results,
        brands: brandsRes.data.results,
        materials: materialsRes.data.results
      });
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/inventory/products/${id}/`);
      const product = response.data;
      
      setFormData({
        type: product.type || '',
        brand: product.brand || '',
        cost_price: product.cost_price || '',
        selling_price: product.selling_price || '',
        size: product.size || '',
        weight: product.weight || '',
        material: product.material || '',
        tags: product.tags || ''
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/inventory/products');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) newErrors.type = 'نوع المنتج مطلوب';
    if (!formData.cost_price || parseFloat(formData.cost_price) <= 0) {
      newErrors.cost_price = 'سعر التكلفة يجب أن يكون أكبر من صفر';
    }
    if (parseFloat(formData.selling_price) <= parseFloat(0)) {
      newErrors.selling_price = 'سعر البيع يجب أن يكون أكبر من صفر';
    }
    if (parseFloat(formData.selling_price) <= parseFloat(formData.cost_price)) {
      newErrors.selling_price = 'سعر البيع يجب أن يكون أكبر من سعر التكلفة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        brand: formData.brand || null,
        material: formData.material || null
      };

      if (isEditing) {
        await axios.put(`/inventory/products/${id}/`, payload);
      } else {
        await axios.post('/inventory/products/', payload);
      }

      navigate('/inventory/products');
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response?.data) {
        const serverErrors = {};
        Object.keys(error.response.data).forEach(key => {
          serverErrors[key] = Array.isArray(error.response.data[key]) 
            ? error.response.data[key][0] 
            : error.response.data[key];
        });
        setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = () => {
    const cost = parseFloat(formData.cost_price) || 0;
    const selling = parseFloat(formData.selling_price) || 0;
    const profit = selling - cost;
    const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
    
    return { profit, profitPct };
  };

  const { profit, profitPct } = calculateProfit();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isEditing ? 'تحرير المنتج' : 'إضافة منتج جديد'}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'قم بتحديث معلومات المنتج' : 'أدخل معلومات المنتج الجديد'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع المنتج *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              <option value="">اختر نوع المنتج</option>
              {options.productTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name_ar}</option>
              ))}
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العلامة التجارية
            </label>
            <select
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر العلامة التجارية (اختياري)</option>
              {options.brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name_ar}</option>
              ))}
            </select>
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              سعر التكلفة ($) *
            </label>
            <input
              type="number"
              name="cost_price"
              value={formData.cost_price}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cost_price ? 'border-red-300' : 'border-gray-300'
              }`}
              required
              dir="ltr"
            />
            {errors.cost_price && <p className="text-red-500 text-sm mt-1">{errors.cost_price}</p>}
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              سعر البيع ($) *
            </label>
            <input
              type="number"
              name="selling_price"
              value={formData.selling_price}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.selling_price ? 'border-red-300' : 'border-gray-300'
              }`}
              required
              dir="ltr"
            />
            {errors.selling_price && <p className="text-red-500 text-sm mt-1">{errors.selling_price}</p>}
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحجم
            </label>
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleChange}
              placeholder="مثال: 30x40cm أو 1L"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوزن (جرام)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              step="0.1"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
            />
          </div>

          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المادة
            </label>
            <select
              name="material"
              value={formData.material}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر المادة (اختياري)</option>
              {options.materials.map(material => (
                <option key={material.id} value={material.id}>{material.name_ar}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العلامات
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="مثال: شفاف، قوي، متعدد الاستخدامات"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-gray-500 text-sm mt-1">افصل العلامات بفواصل</p>
          </div>
        </div>

        {/* Profit Preview */}
        {(formData.cost_price && formData.selling_price) && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">معاينة الربح</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">الربح بالدولار</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profit.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">نسبة الربح</p>
                <p className={`text-2xl font-bold ${profitPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 flex justify-end space-x-4 space-x-reverse">
          <button
            type="button"
            onClick={() => navigate('/inventory/products')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : (isEditing ? 'تحديث المنتج' : 'إضافة المنتج')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;