// Define TypeScript interfaces for analytics data

export interface TimeSeriesDataPoint {
  period: string; // ISO datetime string
  revenue: number;
  costs: number;
  profit: number;
  sales_count: number;
  profit_margin: number;
}

export interface TimeSeriesSummary {
  total_revenue: number;
  total_costs: number;
  total_profit: number;
  total_sales: number;
  profit_margin: number;
  average_sale_value: number;
}

export interface TimeSeriesMeta {
  date_from: string;
  date_to: string;
  resolution: string;
  generated_at: string;
}

export interface TimeSeriesResponse {
  data: TimeSeriesDataPoint[];
  summary: TimeSeriesSummary;
  meta: TimeSeriesMeta;
}

export interface ActualPerformance {
  quantity_sold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface BreakevenProduct {
  product_id: number;
  product_name_ar: string;
  type_name_ar: string;
  brand_name_ar: string;
  unit_price: number;
  unit_cost: number;
  unit_profit: number;
  profit_margin: number;
  breakeven_units: number;
  breakeven_revenue: number;
  fixed_costs_allocated: number;
  actual_performance: ActualPerformance;
  performance_score: number;
  status: 'excellent' | 'good' | 'moderate' | 'profitable' | 'poor';
  available_stock: number;
}

export interface BreakevenSummary {
  total_products: number;
  high_performers: number;
  low_performers: number;
  total_fixed_costs: number;
  total_revenue: number;
  total_profit: number;
  average_performance_score: number;
}

export interface BreakevenMeta {
  fixed_costs: number;
  sort_by: string;
  sort_order: string;
  generated_at: string;
}

export interface BreakevenResponse {
  products: BreakevenProduct[];
  summary: BreakevenSummary;
  meta: BreakevenMeta;
}

// Request types
export interface TimeSeriesRequest {
  date_from?: string;
  date_to?: string;
  resolution?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface BreakevenRequest {
  product_id?: number;
  fixed_costs?: number;
  sort_by?: 'performance' | 'profit' | 'revenue';
  sort_order?: 'asc' | 'desc';
}

export interface ExportRequest {
  export_type: 'timeseries' | 'breakeven';
  format: 'csv' | 'xlsx';
  filename?: string;
  // Timeseries fields
  date_from?: string;
  date_to?: string;
  resolution?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  // Breakeven fields
  product_id?: number;
  fixed_costs?: number;
  sort_by?: 'performance' | 'profit' | 'revenue';
  sort_order?: 'asc' | 'desc';
}

// UI state types
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ChartConfig {
  showRevenue: boolean;
  showCosts: boolean;
  showProfit: boolean;
  showSalesCount: boolean;
}

export interface BreakevenChartConfig {
  selectedProductId?: number;
  fixedCosts: number;
  showBreakevenLine: boolean;
  showPerformanceScore: boolean;
}

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

