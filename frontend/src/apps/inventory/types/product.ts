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

export interface SaleItem {
  id?: number;
  product: number;
  product_name_ar?: string;
  product_brand_ar?: string;
  available_stock?: number;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total_price?: number;
  profit_per_item?: number;
  total_profit?: number;
  profit_percentage?: number;
}

export interface Sale {
  id?: number;
  sale_number?: string;
  sale_date?: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
  status: 'pending' | 'completed' | 'cancelled';
  discount_amount: number;
  tax_percentage: number;
  notes: string;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
  items: SaleItem[];
  // Computed fields
  subtotal?: number;
  total_cost?: number;
  gross_profit?: number;
  discount_applied?: number;
  tax_amount?: number;
  final_total?: number;
  net_profit?: number;
  profit_percentage?: number;
}

export interface SaleListItem {
  id: number;
  sale_number: string;
  sale_date: string;
  customer_name: string;
  payment_method: string;
  status: string;
  created_by_name: string;
  items_count: number;
  final_total: number;
  net_profit: number;
  profit_percentage: number;
}

export interface Invoice {
  id?: number;
  invoice_number?: string;
  sale: number;
  invoice_date?: string;
  due_date?: string | null;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  is_printed: boolean;
  printed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  sale_details?: Sale;
}

export interface InvoiceListItem {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  final_total: number;
  is_printed: boolean;
}

export interface SalesStats {
  overview: {
    total_sales: number;
    total_revenue: number;
    total_profit: number;
    profit_margin: number;
    low_stock_alerts: number;
  };
  today: {
    sales_count: number;
    revenue: number;
    profit: number;
    profit_margin: number;
  };
  this_week: {
    sales_count: number;
    revenue: number;
    profit: number;
    profit_margin: number;
  };
  this_month: {
    sales_count: number;
    revenue: number;
    profit: number;
    profit_margin: number;
  };
  top_products: Array<{
    product__type__name_ar: string;
    product__brand__name_ar: string;
    total_quantity: number;
    total_revenue: number;
    total_profit: number;
  }>;
}

export interface SalesFilters {
  search: string;
  status: string;
  payment_method: string;
  date_from: string;
  date_to: string;
}

export interface ApiResponse<T> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}