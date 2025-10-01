import axios from 'axios';
import type {
  Sale,
  SaleListItem,
  Invoice,
  InvoiceListItem,
  Product,
  SalesStats,
  Inventory,
  ApiResponse
} from '@/types/product';

// Sales API Service
export class SalesService {
  static async getSales(filters?: Record<string, string>): Promise<SaleListItem[]> {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`sales/sales/?${params.toString()}`);
    return response.data.results || response.data;
  }

  static async getSale(id: number): Promise<Sale> {
    const response = await axios.get(`sales/sales/${id}/`);
    return response.data;
  }

  static async createSale(saleData: Partial<Sale>): Promise<Sale> {
    const response = await axios.post('sales/sales/', saleData);
    return response.data;
  }

  static async updateSale(id: number, saleData: Partial<Sale>): Promise<Sale> {
    const response = await axios.put(`sales/sales/${id}/`, saleData);
    return response.data;
  }

  static async deleteSale(id: number): Promise<void> {
    await axios.delete(`sales/sales/${id}/`);
  }

  static async completeSale(id: number): Promise<{ message: string; invoice_id: number; invoice_number: string }> {
    const response = await axios.post(`sales/sales/${id}/complete/`);
    return response.data;
  }

  static async cancelSale(id: number): Promise<{ message: string }> {
    const response = await axios.post(`sales/sales/${id}/cancel/`);
    return response.data;
  }

  static async getSalesStats(): Promise<SalesStats> {
    const response = await axios.get('sales/sales/stats/');
    return response.data;
  }

  static async getSellersDashboard(dateFrom?: string, dateTo?: string): Promise<any> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    const response = await axios.get(`sales/sellers/dashboard/?${params.toString()}`);
    return response.data;
  }

  static async getAvailableProducts(): Promise<Product[]> {
    const response = await axios.get('inventory/products/available/');
    return response.data.products;
  }
}

// Invoice API Service
export class InvoiceService {
  static async getInvoices(filters?: Record<string, string>): Promise<InvoiceListItem[]> {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`sales/invoices/?${params.toString()}`);
    return response.data.results || response.data;
  }

  static async getInvoice(id: number): Promise<Invoice> {
    const response = await axios.get(`sales/invoices/${id}/`);
    return response.data;
  }

  static async getInvoiceBySale(saleId: number): Promise<Invoice> {
    const invoices = await this.getInvoices({ sale: saleId.toString() });
    if (invoices.length === 0) {
      throw new Error('Invoice not found for this sale');
    }
    return this.getInvoice(invoices[0].id);
  }

  static async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const response = await axios.post('sales/invoices/', invoiceData);
    return response.data;
  }

  static async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const response = await axios.put(`sales/invoices/${id}/`, invoiceData);
    return response.data;
  }

  static async markInvoicePrinted(id: number): Promise<{ message: string }> {
    const response = await axios.post(`sales/invoices/${id}/mark_printed/`);
    return response.data;
  }

  static async getInvoicePrintData(id: number): Promise<{ invoice: Invoice; formatted_for_print: boolean; print_timestamp: string }> {
    const response = await axios.get(`sales/invoices/${id}/print_data/`);
    return response.data;
  }
}

// Inventory API Service
export class InventoryService {
  static async getInventory(filters?: Record<string, string>): Promise<Inventory[]> {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`inventory/inventory/?${params.toString()}`);
    return response.data.results || response.data;
  }

  static async updateInventory(id: number, data: { quantity_in_stock: number; minimum_stock_level: number }): Promise<Inventory> {
    const response = await axios.patch(`inventory/inventory/${id}/`, data);
    return response.data;
  }

  static async getLowStockItems(): Promise<Inventory[]> {
    return this.getInventory({ is_low_stock: 'true' });
  }

  static async getOutOfStockItems(): Promise<Inventory[]> {
    return this.getInventory({ is_out_of_stock: 'true' });
  }
}