import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ProductListPage from '../../components/ProductList';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock axios for accessibility tests
vi.mock('axios', () => ({
  get: vi.fn(() => Promise.resolve({ data: { results: [] } })),
  delete: vi.fn(() => Promise.resolve({ status: 204 }))
}));

const A11yWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Product List Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<ProductListPage />, { wrapper: A11yWrapper });
    
    // Wait a bit for component to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', async () => {
    render(<ProductListPage />, { wrapper: A11yWrapper });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check for main heading
    const mainHeading = document.querySelector('h1');
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading).toHaveTextContent('إدارة المنتجات');
  });

  it('should have proper form labels', async () => {
    render(<ProductListPage />, { wrapper: A11yWrapper });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check that form inputs have proper labels
    const searchInput = document.querySelector('input[placeholder="ابحث في المنتجات..."]');
    const searchLabel = document.querySelector('label');
    
    expect(searchInput).toBeInTheDocument();
    expect(searchLabel).toBeInTheDocument();
  });

  it('should have proper table structure', async () => {
    render(<ProductListPage />, { wrapper: A11yWrapper });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check table structure
    const table = document.querySelector('table');
    const thead = document.querySelector('thead');
    const tbody = document.querySelector('tbody');
    
    expect(table).toBeInTheDocument();
    expect(thead).toBeInTheDocument();
    expect(tbody).toBeInTheDocument();
  });
});