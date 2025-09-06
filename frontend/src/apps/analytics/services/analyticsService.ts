import axios from 'axios';

export interface SalesReportData {
  id: number;
  resolution: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  period_display: string;
  sales_count: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  average_sale_value: number;
  profit_margin: number;
  created_at: string;
  updated_at: string;
}

export interface SalesReportTrend {
  period: string;
  period_start: string;
  sales_count: number;
  total_revenue: number;
  total_profit: number;
  profit_margin: number;
  average_sale_value: number;
  changes?: {
    revenue_change_percent: number;
    sales_count_change_percent: number;
    profit_margin_change: number;
  };
}

export interface SalesReportSummary {
  resolution: string;
  total_sales_count: number;
  total_revenue: number;
  total_profit: number;
  average_profit_margin: number;
  period_count: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface SalesReportFilters {
  resolution?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface SalesReportTrendsFilters {
  resolution: string;
  periods?: number;
}

export class AnalyticsService {
  static async getSalesReports(filters?: SalesReportFilters): Promise<SalesReportData[]> {
    const params = new URLSearchParams();
    
    if (filters?.resolution) params.append('resolution', filters.resolution);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axios.get(`reports/sales-reports/?${params.toString()}`);
    return response.data.results;
  }

  static async getSalesReportTrends(filters: SalesReportTrendsFilters): Promise<{
    resolution: string;
    periods_requested: number;
    periods_returned: number;
    trends: SalesReportTrend[];
  }> {
    const params = new URLSearchParams();
    
    // Resolution is required for trends endpoint
    if (!filters.resolution) {
      throw new Error('Resolution is required for sales report trends');
    }
    
    params.append('resolution', filters.resolution);
    if (filters.periods) params.append('periods', filters.periods.toString());

    const response = await axios.get(`reports/sales-reports/trends/?${params.toString()}`);
    return response.data;
  }

  static async getSalesReportSummary(filters: SalesReportFilters): Promise<SalesReportSummary> {
    const params = new URLSearchParams();
    
    // Resolution is required for summary endpoint
    if (!filters.resolution) {
      throw new Error('Resolution is required for sales report summary');
    }
    
    params.append('resolution', filters.resolution);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await axios.get(`reports/sales-reports/summary/?${params.toString()}`);
    return response.data;
  }

  static async getSalesHeatmapData(resolution: 'hourly' | 'daily' = 'hourly'): Promise<SalesReportData[]> {
    // Get recent data for heatmap visualization
    const endDate = new Date();
    const startDate = new Date();
    
    if (resolution === 'hourly') {
      // Get last 7 days of hourly data
      startDate.setDate(endDate.getDate() - 7);
    } else {
      // Get last 30 days of daily data
      startDate.setDate(endDate.getDate() - 30);
    }

    // Format dates properly for Django timezone handling
    const formatDateForAPI = (date: Date): string => {
      return date.toISOString().split('T')[0]; // Send just YYYY-MM-DD format
    };

    return this.getSalesReports({
      resolution,
      start_date: formatDateForAPI(startDate),
      end_date: formatDateForAPI(endDate),
      limit: 200
    });
  }
}