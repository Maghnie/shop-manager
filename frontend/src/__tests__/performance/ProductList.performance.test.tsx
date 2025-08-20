import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductListPage from '../../components/ProductList';

// Mock a large dataset for performance testing
const generateMockProducts = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    type_name_ar: `منتج ${index + 1}`,
    type_name_en: `Product ${index + 1}`,
    brand_name_ar: `علامة ${index + 1}`,
    brand_name_en: `Brand ${index + 1}`,
    size: 'متوسط',
    cost_price: 50 + index,
    selling_price: 100 + index,
    profit: 50,
    profit_percentage: 100,
    tags_list: [`تاغ${index}`, `تاغ${index + 1}`],
    type: (index % 3) + 1,
    brand: (index % 5) + 1,
    material: (index % 2) + 1
  }));
};

vi.mock('axios', () => ({
  get: vi.fn((url) => {
    switch (url) {
      case 'inventory/products/':
        return Promise.resolve({ data: { results: generateMockProducts(1000) } });
      case 'inventory/product-types/':
        return Promise.resolve({ data: { results: [{ id: 1, name_ar: 'نوع 1' }] } });
      case 'inventory/brands/':
        return Promise.resolve({ data: { results: [{ id: 1, name_ar: 'علامة 1' }] } });
      case 'inventory/materials/':
        return Promise.resolve({ data: { results: [{ id: 1, name_ar: 'مادة 1' }] } });
      default:
        return Promise.reject(new Error('Unknown URL'));
    }
  }),
  delete: vi.fn(() => Promise.resolve({ status: 204 }))
}));

const PerformanceWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Product List Performance', () => {
  it('should render large datasets efficiently', async () => {
    const startTime = performance.now();
    
    render(<ProductListPage />, { wrapper: PerformanceWrapper });
    
    // Wait for component to load
    await screen.findByText('إدارة المنتجات', {}, { timeout: 5000 });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(3000); // 3 seconds
  });

  it('should handle filtering large datasets efficiently', async () => {
    render(<ProductListPage />, { wrapper: PerformanceWrapper });
    
    // Wait for initial load
    await screen.findByText('إدارة المنتجات', {}, { timeout: 5000 });
    
    const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
    
    const startTime = performance.now();
    
    // Simulate typing
    fireEvent.change(searchInput, { target: { value: 'منتج 1' } });
    
    const endTime = performance.now();
    const filterTime = endTime - startTime;
    
    // Filtering should be fast
    expect(filterTime).toBeLessThan(100); // 100ms
  });
});