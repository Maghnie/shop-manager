// This hook manages product data and filtering functionality

import { useState, useEffect } from "react";
import type { Product, ProductType, ProductBrand, ProductMaterial, Filters } from "../types/product";
import { fetchProducts, fetchTypes, fetchBrands, fetchMaterials } from "../services/productService";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [materials, setMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    type: "",
    brand: "",
    material: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [p, t, b, m] = await Promise.all([
          fetchProducts(),
          fetchTypes(),
          fetchBrands(),
          fetchMaterials(),
        ]);
        setProducts(p.data.results);
        setProductTypes(t.data.results);
        setBrands(b.data.results);
        setMaterials(m.data.results);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (filters.search) {
      filtered = filtered.filter(p =>
        [p.type_name_ar, p.type_name_en, p.brand_name_ar, p.brand_name_en, p.tags_list.join(" ")]
          .some(val => val?.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (filters.type) filtered = filtered.filter(p => (p as any).type === parseInt(filters.type));
    if (filters.brand) filtered = filtered.filter(p => (p as any).brand === parseInt(filters.brand));
    if (filters.material) filtered = filtered.filter(p => (p as any).material === parseInt(filters.material));

    setFilteredProducts(filtered);
  }, [products, filters]);

  return {
    products,
    filteredProducts,
    productTypes,
    brands,
    materials,
    loading,
    filters,
    setFilters,
    setProducts,
  };
};
