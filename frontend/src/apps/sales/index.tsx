export { SalesDashboard, SalesList, SaleForm, SaleDetail, QuickSale } from './pages';
export { useSales, useSale, useAvailableProducts, useSalesStats, useSalesCalculations } from './hooks';
export { SalesService, InvoiceService, InventoryService } from './services';
export type { 
  Sale, 
  SaleListItem, 
  SaleItem, 
  SalesFilters, 
  SalesStats, 
  QuickSaleResponse 
} from '@/types/product';