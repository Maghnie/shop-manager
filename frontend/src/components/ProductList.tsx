import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Product {
  type_name_ar: string;
  type_name_en: string;
  brand_name_ar: string;
  brand_name_en: string;
  size: string;
  id: number;
  cost_price: number;
  selling_price: number;
  profit: number;
  profit_percentage: number;
  tags_list: string[];
}

interface ProductMaterial {
  id: number;
  name_ar: string;
}

interface ProductBrand {
  id: number;
  name_ar: string;
}

interface ProductType {
  id: number;
  name_ar: string;
}

type Filters = {
  search: string;
  type: string;
  brand: string;
  material: string;  
};

const ProductList: React.FC = () => {  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [materials, setMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: '',
    brand: '',
    material: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters]);
  
  const fetchData = async () => {    
    try {      
      const [productsRes, typesRes, brandsRes, materialsRes] = await Promise.all([
        axios.get('inventory/products/'),
        axios.get('inventory/product-types/'),
        axios.get('inventory/brands/'),
        axios.get('inventory/materials/'),
      ]);
      
      setProducts(productsRes.data.results);     
      setProductTypes(typesRes.data.results);
      setBrands(brandsRes.data.results);
      setMaterials(materialsRes.data.results);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products].reverse();

    if (filters.search) {
      filtered = filtered.filter(product =>
        product.type_name_ar?.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.brand_name_ar?.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.type_name_en?.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.brand_name_en?.toLowerCase().includes(filters.search.toLowerCase()) ||
        (Array.isArray(product.tags_list) 
          && product.tags_list.join(' ').toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (filters.type) {
      filtered = filtered.filter(product => (product as any).type === parseInt(filters.type));
    }

    if (filters.brand) {
      filtered = filtered.filter(product => (product as any).brand === parseInt(filters.brand));
    }

    if (filters.material) {
      filtered = filtered.filter(product => (product as any).material === parseInt(filters.material));
    }

    setFilteredProducts(filtered);
  };

  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDelete = async (productId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await axios.delete(`/inventory/products/${productId}/`);
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        alert('حدث خطأ أثناء حذف المنتج');
      }
    }
  };

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل المنتجات...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">إدارة المنتجات</h1>
          <p className="text-gray-600">
            إجمالي المنتجات: {filteredProducts.length} من {products.length}
          </p>
        </div>
        <Link
          to="/products/new"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold"
        >
          إضافة منتج جديد +
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">البحث والتصفية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البحث
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="ابحث في المنتجات..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              النوع
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الأنواع</option>
              {productTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name_ar}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العلامة التجارية
            </label>
            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع العلامات التجارية</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name_ar}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المادة
            </label>
            <select
              value={filters.material}
              onChange={(e) => handleFilterChange('material', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع المواد</option>
              {materials.map(material => (
                <option key={material.id} value={material.id}>{material.name_ar}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">رقم تعريفي</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">النوع</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">العلامة التجارية</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">الحجم</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">سعر التكلفة</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700 bg-yellow-200">سعر البيع</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">الربح</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">نسبة الربح</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">الوسوم</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    لا توجد منتجات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{product.id}</td>
                    <td className="py-4 px-6 font-medium">{product.type_name_ar}</td>
                    <td className="py-4 px-6">{product.brand_name_ar || 'غير محدد'}</td>
                    <td className="py-4 px-6">{product.size || 'غير محدد'}</td>
                    <td className="py-4 px-6">{formatCurrency(product.cost_price)}</td>
                    <td className="py-4 px-6 bg-yellow-100">{formatCurrency(product.selling_price)}</td>
                    <td className="py-4 px-6 text-green-600 font-semibold">
                      {formatCurrency(product.profit)}
                    </td>
                    <td className="py-4 px-6 text-green-600 font-semibold">
                      {product.profit_percentage.toFixed(1)}%
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(product.tags_list) && product.tags_list.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {product.tags_list.length > 3 && (
                          <div className="relative group inline-block">
                            <span className="text-xs text-gray-500 cursor-pointer flex items-center gap-1">
                              +{product.tags_list.length - 3}
                              <Info size={12} className="text-gray-400" />
                            </span>
                            <div className="absolute z-10 hidden group-hover:flex flex-wrap bg-white shadow-lg rounded-lg p-2 text-xs text-gray-700 w-48 bottom-full mb-2">
                              {product.tags_list.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full m-1"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center space-x-2 space-x-reverse">
                        <Link
                          to={`/products/${product.id}/edit`}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200"
                        >
                          تحرير
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-200"
                        >
                          حذف
                        </button>
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

export default ProductList;