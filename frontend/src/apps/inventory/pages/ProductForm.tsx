import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';

// Type definitions
interface ProductType {
  id: number;
  name_ar: string;
  name_en: string;
}

interface Brand {
  id: number;
  name_ar: string;
}

interface Material {
  id: number;
  name_ar: string;
}

interface FormData {
  type: string; // what users type
  typeId?: number; // optional selected ID if matched
  brand: string;
  cost_price: string;
  selling_price: string;
  size: string;
  weight: string;
  material: string;
  tags: string;
}

interface Options {
  productTypes: ProductType[];
  brands: Brand[];
  materials: Material[];
}

interface ValidationErrors {
  [key: string]: string;
}

interface ProductPayload {
  type: string;
  brand: string | null;
  cost_price: number;
  selling_price: number;
  size: string;
  weight: number | null;
  material: string | null;
  tags: string;
}

interface ApiErrorResponse {
  [key: string]: string | string[];
}

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    type: '',
    brand: '1', // id for the default brand: "general" or "عام"
    cost_price: '',
    selling_price: '',
    size: '',
    weight: '',
    material: '',
    tags: ''
  });

  const [options, setOptions] = useState<Options>({
    productTypes: [],
    brands: [],
    materials: []
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    fetchOptions();
    if (isEditing && id) {
      fetchProduct();
    }
  }, [id, isEditing]);

  const fetchOptions = async (): Promise<void> => {
    try {
      const [typesRes, brandsRes, materialsRes] = await Promise.all([
        axios.get<{ results: ProductType[] }>('/inventory/product-types/'),
        axios.get<{ results: Brand[] }>('/inventory/brands/'),
        axios.get<{ results: Material[] }>('/inventory/materials/')
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

  const fetchProduct = async (): Promise<void> => {
    if (!id) return;

    try {
      const response = await axios.get(`/inventory/products/${id}/`);
      const product = response.data;

      // // Try to find matching type name in options
      // let typeName = '';
      // let typeId: number | undefined = undefined;

      // if (product.type) {
      //   const matchedType = options.productTypes.find(pt => pt.id === product.type);
      //   if (matchedType) {
      //     typeName = matchedType.type_name_ar;
      //     typeId = matchedType.id;
      //   } else {
      //     // Fallback: fetch product type by ID if not already loaded
      //     try {
      //       const typeRes = await axios.get(`/inventory/product-types/${product.type}/`);
      //       typeName = typeRes.data.name_ar;
      //       typeId = typeRes.data.id;

      //       // Add it to local options so it shows up in combobox next time
      //       setOptions(prev => ({
      //         ...prev,
      //         productTypes: [...prev.productTypes, typeRes.data],
      //       }));
      //     } catch (err) {
      //       console.warn("Couldn't fetch product type details", err);
      //       typeName = String(product.type); // fallback
      //     }
      //   }
      // }

      // setFormData({
      //   type: typeName,
      //   typeId: typeId,
      //   brand: product.brand?.toString() || '',
      //   cost_price: product.cost_price?.toString() || '',
      //   selling_price: product.selling_price?.toString() || '',
      //   size: product.size || '',
      //   weight: product.weight?.toString() || '',
      //   material: product.material?.toString() || '',
      //   tags: product.tags || ''
      // });
      setFormData({
        type: product.type_name_ar || '',   // show the name in the combobox
        typeId: product.type || undefined,  // keep the ID for backend submission
        brand: product.brand?.toString() || '',
        cost_price: product.cost_price?.toString() || '',
        selling_price: product.selling_price?.toString() || '',
        size: product.size || '',
        weight: product.weight?.toString() || '',
        material: product.material?.toString() || '',
        tags: product.tags || ''
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/products/');
    }
  };


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
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

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Type validation - required field
    if (!formData.type || formData.type.trim() === '') {
      newErrors.type = 'نوع المنتج مطلوب';
    }

    // Cost price validation
    const costPrice = parseFloat(formData.cost_price);
    if (!formData.cost_price || isNaN(costPrice) || costPrice <= 0) {
      newErrors.cost_price = 'سعر التكلفة يجب أن يكون أكبر من صفر';
    }

    // Selling price validation
    const sellingPrice = parseFloat(formData.selling_price);
    if (!formData.selling_price || isNaN(sellingPrice) || sellingPrice <= 0) {
      newErrors.selling_price = 'سعر البيع يجب أن يكون أكبر من صفر';
    }

    // Compare selling price with cost price only if both are valid numbers
    if (!isNaN(costPrice) && !isNaN(sellingPrice) && sellingPrice <= costPrice) {
      newErrors.selling_price = 'سعر البيع يجب أن يكون أكبر من سعر التكلفة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      let typeId = formData.typeId;

      // If user typed a new type, create it first
      if (!typeId && formData.type) {
        const typeRes = await axios.post('/inventory/product-types/', {
          name_ar: formData.type,
          name_en: formData.type, // just reusing arabic name for custom entries for now
        });
        typeId = typeRes.data.id;

        // Add new type to local options so it appears in future
        setOptions(prev => ({
          ...prev,
          productTypes: [...prev.productTypes, typeRes.data],
        }));
      }

      const payload: ProductPayload = {
        type: String(typeId), // always send ID
        brand: formData.brand || "1", // use default brand if user didnt specify
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        size: formData.size,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        material: formData.material || null,
        tags: formData.tags,
      };

      if (isEditing && id) {
        await axios.put(`/inventory/products/${id}/`, payload);
      } else {
        await axios.post('/inventory/products/', payload);
      }

      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.data) {
        const serverErrors: ValidationErrors = {};
        Object.keys(axiosError.response.data).forEach(key => {
          const errorValue = axiosError.response!.data[key];
          serverErrors[key] = Array.isArray(errorValue)
            ? errorValue[0]
            : errorValue;
        });
        setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };


  const calculateProfit = (): { profit: number; profitPct: number } => {
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
          {/* Product Type with free text + autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع المنتج *
            </label>
            <Combobox
              value={formData.type}
              onChange={(value: string) => {
                const matched = options.productTypes.find(pt => pt.name_ar === value);
                setFormData(prev => ({
                  ...prev,
                  type: value,
                  typeId: matched ? matched.id : undefined
                }));
                if (errors.type) {
                  setErrors(prev => ({ ...prev, type: '' }));
                }
              }}
            >
              <ComboboxInput
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.type ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="حدد نوع المنتج أو أضف جديد"
                displayValue={(value: string) => value}
                onChange={e =>
                  setFormData(prev => ({ ...prev, type: e.target.value, typeId: undefined }))
                }
              />
              <ComboboxOptions className="border mt-1 rounded-lg bg-white shadow-lg max-h-60 overflow-auto">
                {options.productTypes
                  .filter(pt => pt.name_ar.includes(formData.type))
                  .map(pt => (
                    <ComboboxOption
                      key={pt.id}
                      value={pt.name_ar}
                      className="cursor-pointer px-4 py-2 hover:bg-blue-100"
                    >
                      {pt.name_ar}
                    </ComboboxOption>
                  ))}
              </ComboboxOptions>
            </Combobox>
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
              defaultValue="عام"
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">اختر العلامة التجارية (اختياري)</option>
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
            onClick={() => navigate('/products')}
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