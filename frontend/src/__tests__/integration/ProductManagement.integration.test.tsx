import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import ProductListPage from '../../components/ProductList';
import { BrowserRouter } from 'react-router-dom';

// Integration test wrapper
const IntegrationWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Product Management Integration Tests', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should handle complete product management workflow', async () => {
    const user = userEvent.setup();
    
    render(<ProductListPage />, { wrapper: IntegrationWrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('جاري تحميل المنتجات...')).not.toBeInTheDocument();
    });

    // Test search functionality
    const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
    await user.type(searchInput, 'كرسي');

    await waitFor(() => {
      expect(screen.getByDisplayValue('كرسي')).toBeInTheDocument();
    });

    // Test filter functionality
    const typeSelect = screen.getByDisplayValue('جميع الأنواع');
    await user.selectOptions(typeSelect, '1');

    // Test admin view toggle
    const adminToggle = screen.getByText('عرض أدوات المسؤول');
    await user.click(adminToggle);

    await waitFor(() => {
      expect(screen.getByText('تحرير')).toBeInTheDocument();
      expect(screen.getByText('حذف')).toBeInTheDocument();
    });

    // Test navigation links
    expect(screen.getByText('إضافة منتج جديد +').closest('a')).toHaveAttribute('href', '/products/new');
  });

  it('should handle error states gracefully', async () => {
    // Mock API error by intercepting the request
    server.use(
      rest.get('/api/inventory/products/', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<ProductListPage />, { wrapper: IntegrationWrapper });

    // Should handle error and stop loading
    await waitFor(() => {
      expect(screen.queryByText('جاري تحميل المنتجات...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should persist filters across admin view toggles', async () => {
    const user = userEvent.setup();
    
    render(<ProductListPage />, { wrapper: IntegrationWrapper });

    await waitFor(() => {
      expect(screen.queryByText('جاري تحميل المنتجات...')).not.toBeInTheDocument();
    });

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
    await user.type(searchInput, 'test');

    // Toggle admin view
    const adminToggle = screen.getByText('عرض أدوات المسؤول');
    await user.click(adminToggle);

    // Filter should still be applied
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();

    // Toggle back
    const hideAdminToggle = screen.getByText('إخفاء أدوات المسؤول');
    await user.click(hideAdminToggle);

    // Filter should still be applied
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });
});