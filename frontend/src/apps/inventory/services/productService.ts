import axios from "axios";
import type { Product, ProductType, ProductBrand, ProductMaterial } from "@/types/product";

// Payload type for creating/updating products
export interface ProductPayload {
  type: string;
  brand: string | null;
  cost_price: number;
  selling_price: number;
  size: string;
  weight: number | null;
  material: string | null;
  tags: string;
}

// Existing fetch functions
export const fetchProducts = () => axios.get("inventory/products/");
export const fetchTypes = () => axios.get("inventory/product-types/");
export const fetchBrands = () => axios.get("inventory/brands/");
export const fetchMaterials = () => axios.get("inventory/materials/");

export const deleteProduct = (id: number) =>
  axios.delete(`/inventory/products/${id}/`);

export const toggleProductArchive = (id: number, forceArchive: boolean = false) =>
  axios.post(`/inventory/products/${id}/toggle-archive/`, { force_archive: forceArchive });

export const fetchArchivedProducts = () =>
  axios.get("inventory/products/", { params: { archived: true } });

// New service functions for ProductForm
export const getProduct = async (id: number): Promise<Product> => {
  const response = await axios.get(`/inventory/products/${id}/`);
  return response.data;
};

export const createProduct = async (productData: ProductPayload): Promise<Product> => {
  const response = await axios.post('/inventory/products/', productData);
  return response.data;
};

export const updateProduct = async (id: number, productData: ProductPayload): Promise<Product> => {
  const response = await axios.put(`/inventory/products/${id}/`, productData);
  return response.data;
};

export const createProductType = async (typeData: { name_ar: string; name_en: string }): Promise<ProductType> => {
  const response = await axios.post('/inventory/product-types/', typeData);
  return response.data;
};
