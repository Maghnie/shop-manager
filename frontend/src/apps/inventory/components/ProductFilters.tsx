import React from "react";
import type { Filters, ProductType, ProductBrand, ProductMaterial } from "@/types/product";

interface Props {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  productTypes: ProductType[];
  brands: ProductBrand[];
  materials: ProductMaterial[];
}

const ProductFilters: React.FC<Props> = ({ filters, setFilters, productTypes, brands, materials }) => {
  const handleChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">البحث والتصفية</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            placeholder="ابحث في المنتجات..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
          <select
            value={filters.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">جميع الأنواع</option>
            {productTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name_ar}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">العلامة التجارية</label>
          <select
            value={filters.brand}
            onChange={(e) => handleChange("brand", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">جميع العلامات التجارية</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>{brand.name_ar}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">المادة</label>
          <select
            value={filters.material}
            onChange={(e) => handleChange("material", e.target.value)}
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
  );
};

export default ProductFilters;
