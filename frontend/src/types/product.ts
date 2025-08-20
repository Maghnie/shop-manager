export interface Product {
  id: number;
  type_name_ar: string;
  type_name_en: string;
  brand_name_ar: string | null;
  brand_name_en: string | null;
  size: string | null;
  cost_price: number;
  selling_price: number;
  profit: number;
  profit_percentage: number;
  tags_list: string[];
}

export interface ProductType {
  id: number;
  name_ar: string;
}

export interface ProductBrand {
  id: number;
  name_ar: string;
}

export interface ProductMaterial {
  id: number;
  name_ar: string;
}

export type Filters = {
  search: string;
  type: string;
  brand: string;
  material: string;
};
