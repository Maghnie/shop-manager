// TODO (optional) generate types dynamically from backend models

export interface Product {
  id: number;
  type: number;
  type_name_ar: string;
  type_name_en: string;
  brand: number | null;
  brand_name_ar: string | null;
  brand_name_en: string | null;
  material: number | null;
  material_name_ar: string | null;
  material_name_en: string | null;
  cost_price: number;
  selling_price: number;
  size: string;
  weight: number | null;
  tags: string;
  tags_list: string[];
  profit: number;
  profit_percentage: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  available_stock: number;
  is_low_stock: boolean;
  is_active: boolean;
}

export interface ProductType {
  id: number;
  name_en: string;
  name_ar: string;
  created_at: string;
}

export interface ProductBrand {
  id: number;
  name_en: string;
  name_ar: string;
  created_at: string;
}

export interface ProductMaterial {
  id: number;
  name_en: string;
  name_ar: string;
  created_at: string;
}

export type Filters = {
  search: string;
  type: string;
  brand: string;
  material: string;
};

export interface Inventory {
  id: number;
  product: number;
  product_name: string;
  product_type: string;
  quantity_in_stock: number;
  minimum_stock_level: number;
  last_updated: string;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

export interface ApiResponse<T> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}