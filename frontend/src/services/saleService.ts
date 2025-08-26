import axios from 'axios';
import type {
  Sale,
  SaleListItem,
  Invoice,
  InvoiceListItem,
  Product,
  SalesStats,
  QuickSaleResponse,
  Inventory,
  ApiResponse
} from '@/types/product';

// Sales API Service
export class SalesService {
  static async getSales(filters?: Record<string, string>): Promise<SaleListItem[]> {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`inventory/sales/?${params.toString()}`);
    return response.data.results || response.data;
  }

  static async getSale(id: number): Promise<Sale> {
    const response = await axios.get(`inventory/sales/${id}/`);
    return response.data;
  }

  static async createSale(saleData: Partial<Sale>): Promise<Sale> {
    const response = await axios.post('inventory/sales/', saleData);
    return response.data;
  }

  static async updateSale(id: number, saleData: Partial<Sale>): Promise<Sale> {
    const response = await axios.put(`inventory/sales/${id}/`, saleData);
    return response.data;
  }

  static async deleteSale(id: number): Promise<void> {
    await axios.delete(`inventory/sales/${id}/`);
  }

  static async completeSale(id: number): Promise<{ message: string; invoice_id: number; invoice_number: string }> {
    const response = await axios.post(`inventory/sales/${id}/complete/`);
    return response.data;
  }

  static async cancelSale(id: number): Promise<{ message: string }> {
    const response = await axios.post(`inventory/sales/${id}/cancel/`);
    return response.data;
  }

  static async createQuickSale(saleData: Partial<Sale>): Promise<QuickSaleResponse> {
    const response = await axios.post('inventory/sales/quick/', saleData);
    return response.data;
  }

  static async getSalesStats(): Promise<SalesStats> {
    const response = await axios.get('inventory/sales/stats/');
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
    const response = await axios.get(`inventory/invoices/?${params.toString()}`);
    return response.data.results || response.data;
  }

  static async getInvoice(id: number): Promise<Invoice> {
    const response = await axios.get(`inventory/invoices/${id}/`);
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
    const response = await axios.post('inventory/invoices/', invoiceData);
    return response.data;
  }

  static async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const response = await axios.put(`inventory/invoices/${id}/`, invoiceData);
    return response.data;
  }

  static async markInvoicePrinted(id: number): Promise<{ message: string }> {
    const response = await axios.post(`inventory/invoices/${id}/mark_printed/`);
    return response.data;
  }

  static async getInvoicePrintData(id: number): Promise<{ invoice: Invoice; formatted_for_print: boolean; print_timestamp: string }> {
    const response = await axios.get(`inventory/invoices/${id}/print_data/`);
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