import axios from 'axios';
import type {
  TimeSeriesResponse,
  BreakevenResponse,
  TimeSeriesRequest,
  BreakevenRequest,
  ExportRequest,
  ApiResponse
} from '../types/analytics';

export class AnalyticsService {
  private static readonly BASE_URL = '/analytics';

  /**
   * Get time series analytics data
   */
  static async getTimeSeriesData(params: TimeSeriesRequest): Promise<TimeSeriesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.date_from) {
        queryParams.append('date_from', params.date_from);
      }
      if (params.date_to) {
        queryParams.append('date_to', params.date_to);
      }
      if (params.resolution) {
        queryParams.append('resolution', params.resolution);
      }
      if (params.product_id) {
        queryParams.append('product_id', params.product_id.toString());
      }

      const response = await axios.get(
        `${this.BASE_URL}/time-series/?${queryParams.toString()}`
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'فشل في تحميل بيانات السلاسل الزمنية'
      );
    }
  }

  /**
   * Get breakeven analysis data
   */
  static async getBreakevenData(params: BreakevenRequest): Promise<BreakevenResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.product_id) {
        queryParams.append('product_id', params.product_id.toString());
      }
      if (params.fixed_costs !== undefined) {
        queryParams.append('fixed_costs', params.fixed_costs.toString());
      }
      if (params.sort_by) {
        queryParams.append('sort_by', params.sort_by);
      }
      if (params.sort_order) {
        queryParams.append('sort_order', params.sort_order);
      }

      const response = await axios.get(
        `${this.BASE_URL}/breakeven/?${queryParams.toString()}`
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'فشل في تحميل بيانات تحليل نقطة التعادل'
      );
    }
  }

  /**
   * Export analytics data
   */
  static async exportData(params: ExportRequest): Promise<Blob> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/export/`,
        params,
        {
          responseType: 'blob'
        }
      );

      // Create blob from response
      const contentType = response.headers['content-type'] || 
        (params.format === 'xlsx' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
        );
      
      return new Blob([response.data], { type: contentType });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'فشل في تصدير البيانات'
      );
    }
  }

  /**
   * Download exported file
   */
  static async downloadFile(blob: Blob, filename: string): Promise<void> {
    try {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('فشل في تنزيل الملف');
    }
  }

  /**
   * Format date for API - returns YYYY-MM-DD format for better readability
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse API date
   */
  static parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-UK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-UK', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value / 100);
  }

  /**
   * Generate default filename for export
   */
  static generateFilename(
    exportType: 'timeseries' | 'breakeven',
    format: 'csv' | 'xlsx',
    params?: any
  ): string {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    if (exportType === 'timeseries') {
      const resolution = params?.resolution || 'daily';
      return `time_series_${resolution}_${timestamp}.${format}`;
    } else {
      const productId = params?.product_id ? `_product_${params.product_id}` : '';
      return `breakeven_analysis${productId}_${timestamp}.${format}`;
    }
  }
}