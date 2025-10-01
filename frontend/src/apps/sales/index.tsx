export { SalesDashboard, SalesList, SaleForm, SaleDetail } from './pages';
export { useSales, useSale, useAvailableProducts, useSalesStats, useSalesCalculations } from './hooks';
export { SalesService, InvoiceService, InventoryService } from './services';
export type {
  Sale,
  SaleListItem,
  SaleItem,
  SalesFilters,
  SalesStats
} from '@/types/product';