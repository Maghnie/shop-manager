import axios from "axios";

export const fetchProducts = () => axios.get("inventory/products/");
export const fetchTypes = () => axios.get("inventory/product-types/");
export const fetchBrands = () => axios.get("inventory/brands/");
export const fetchMaterials = () => axios.get("inventory/materials/");

export const deleteProduct = (id: number) =>
  axios.delete(`/inventory/products/${id}/`);
