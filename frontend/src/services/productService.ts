import axios from "axios";

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
