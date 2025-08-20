
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import ProductOverview from '@/pages/ProductOverview';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  }
}));

const mockedAxios = axios as any;

// Mock data
const mockProducts = [
  {
    id: 1,
    type_name_ar: 'كرسي',
    type_name_en: 'Chair',
    brand_name_ar: 'ايكيا',
    brand_name_en: 'IKEA',
    size: 'متوسط',
    cost_price: 50,
    selling_price: 100,
    profit: 50,
    profit_percentage: 100,
    tags_list: ['مريح', 'خشبي'],
    type: 1,
    brand: 1,
    material: 1
  },
  {
    id: 2,
    type_name_ar: 'طاولة',
    type_name_en: 'Table',
    brand_name_ar: 'هوم سنتر',
    brand_name_en: 'Home Center',
    size: 'كبير',
    cost_price: 200,
    selling_price: 350,
    profit: 150,
    profit_percentage: 75,
    tags_list: ['خشبي', 'قوي'],
    type: 2,
    brand: 2,
    material: 1
  }
];

const mockProductTypes = [
  { id: 1, name_ar: 'كرسي' },
  { id: 2, name_ar: 'طاولة' }
];

const mockBrands = [
  { id: 1, name_ar: 'ايكيا' },
  { id: 2, name_ar: 'هوم سنتر' }
];

const mockMaterials = [
  { id: 1, name_ar: 'خشب' },
  { id: 2, name_ar: 'معدن' }
];

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Product List Functionality', () => {
  beforeEach(() => {
    // Mock successful API responses
    mockedAxios.get.mockImplementation((url: string) => {
      switch (url) {
        case 'inventory/products/':
          return Promise.resolve({ data: { results: mockProducts } });
        case 'inventory/product-types/':
          return Promise.resolve({ data: { results: mockProductTypes } });
        case 'inventory/brands/':
          return Promise.resolve({ data: { results: mockBrands } });
        case 'inventory/materials/':
          return Promise.resolve({ data: { results: mockMaterials } });
        default:
          return Promise.reject(new Error('Unknown URL'));
      }
    });

    mockedAxios.delete.mockResolvedValue({ status: 204 });
    
    // Mock window.confirm
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: vi.fn().mockReturnValue(true)
    });
    
    // Mock window.alert
    Object.defineProperty(window, 'alert', {
      writable: true,
      value: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Product Display and Loading', () => {
    it('should display loading state initially', () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      expect(screen.getByText('جاري تحميل المنتجات...')).toBeInTheDocument();
    });

    it('should display products after loading', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.getByText('طاولة')).toBeInTheDocument();
      });
    });

    it('should display product count correctly', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText(/إجمالي المنتجات: 2 من 2/)).toBeInTheDocument();
      });
    });

    it('should display all product information correctly', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        // Check first product details
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.getByText('ايكيا')).toBeInTheDocument();
        expect(screen.getByText('متوسط')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();
        expect(screen.getByText('$100.00')).toBeInTheDocument();
        expect(screen.getByText('100.0%')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter products by search term in Arabic type name', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
      fireEvent.change(searchInput, { target: { value: 'كرسي' } });

      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.queryByText('طاولة')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/إجمالي المنتجات: 1 من 2/)).toBeInTheDocument();
    });

    it('should filter products by search term in English type name', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('طاولة')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
      fireEvent.change(searchInput, { target: { value: 'Table' } });

      await waitFor(() => {
        expect(screen.getByText('طاولة')).toBeInTheDocument();
        expect(screen.queryByText('كرسي')).not.toBeInTheDocument();
      });
    });

    it('should filter products by brand name', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('ايكيا')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
      fireEvent.change(searchInput, { target: { value: 'ايكيا' } });

      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.queryByText('طاولة')).not.toBeInTheDocument();
      });
    });

    it('should filter products by tags', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
      fireEvent.change(searchInput, { target: { value: 'مريح' } });

      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.queryByText('طاولة')).not.toBeInTheDocument();
      });
    });

    it('should show no results message when search yields no matches', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
      fireEvent.change(searchInput, { target: { value: 'منتج غير موجود' } });

      await waitFor(() => {
        expect(screen.getByText('لا توجد منتجات مطابقة للبحث')).toBeInTheDocument();
      });

      expect(screen.getByText(/إجمالي المنتجات: 0 من 2/)).toBeInTheDocument();
    });

    it('should perform case-insensitive search', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
      fireEvent.change(searchInput, { target: { value: 'chair' } });

      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.queryByText('طاولة')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should filter products by type', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      const typeSelect = screen.getByDisplayValue('جميع الأنواع');
      fireEvent.change(typeSelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.queryByText('طاولة')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/إجمالي المنتجات: 1 من 2/)).toBeInTheDocument();
    });

    it('should filter products by brand', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('هوم سنتر')).toBeInTheDocument();
      });

      const brandSelect = screen.getByDisplayValue('جميع العلامات التجارية');
      fireEvent.change(brandSelect, { target: { value: '2' } });

      await waitFor(() => {
        expect(screen.getByText('طاولة')).toBeInTheDocument();
        expect(screen.queryByText('كرسي')).not.toBeInTheDocument();
      });
    });

    it('should filter products by material', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      const materialSelect = screen.getByDisplayValue('جميع المواد');
      fireEvent.change(materialSelect, { target: { value: '1' } });

      await waitFor(() => {
        // Both products have material 1, so both should be visible
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.getByText('طاولة')).toBeInTheDocument();
      });
    });

    it('should combine search and filters', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      // First filter by type
      const typeSelect = screen.getByDisplayValue('جميع الأنواع');
      fireEvent.change(typeSelect, { target: { value: '1' } });

      // Then search
      const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
      fireEvent.change(searchInput, { target: { value: 'كرسي' } });

      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.queryByText('طاولة')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/إجمالي المنتجات: 1 من 2/)).toBeInTheDocument();
    });

    it('should reset filters properly', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      // Apply filter
      const typeSelect = screen.getByDisplayValue('جميع الأنواع');
      fireEvent.change(typeSelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(screen.queryByText('طاولة')).not.toBeInTheDocument();
      });

      // Reset filter
      fireEvent.change(typeSelect, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
        expect(screen.getByText('طاولة')).toBeInTheDocument();
      });
    });
  });

  describe('Admin View Toggle', () => {
    it('should toggle admin view and show/hide admin actions', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      // Initially admin actions should not be visible
      expect(screen.queryByText('تحرير')).not.toBeInTheDocument();
      expect(screen.queryByText('حذف')).not.toBeInTheDocument();

      // Toggle admin view
      const adminToggle = screen.getByText('عرض أدوات المسؤول');
      fireEvent.click(adminToggle);

      await waitFor(() => {
        expect(screen.getByText('تحرير')).toBeInTheDocument();
        expect(screen.getByText('حذف')).toBeInTheDocument();
      });

      // Toggle back
      const hideAdminToggle = screen.getByText('إخفاء أدوات المسؤول');
      fireEvent.click(hideAdminToggle);

      await waitFor(() => {
        expect(screen.queryByText('تحرير')).not.toBeInTheDocument();
        expect(screen.queryByText('حذف')).not.toBeInTheDocument();
      });
    });

    it('should show admin column header when admin view is active', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      // Initially admin column header should not be visible
      expect(screen.queryByText('الإجراءات')).not.toBeInTheDocument();

      // Toggle admin view
      const adminToggle = screen.getByText('عرض أدوات المسؤول');
      fireEvent.click(adminToggle);

      await waitFor(() => {
        expect(screen.getByText('الإجراءات')).toBeInTheDocument();
      });
    });
  });

  describe('Product Deletion', () => {
    it('should delete product when confirmed', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      // Enable admin view
      const adminToggle = screen.getByText('عرض أدوات المسؤول');
      fireEvent.click(adminToggle);

      await waitFor(() => {
        expect(screen.getByText('حذف')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByText('حذف');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockedAxios.delete).toHaveBeenCalledWith('/inventory/products/1/');
      });

      expect(window.confirm).toHaveBeenCalledWith('هل أنت متأكد من حذف هذا المنتج؟');
    });

    it('should not delete product when not confirmed', async () => {
      // Mock confirm to return false
      (window.confirm as any).mockReturnValue(false);
      
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      // Enable admin view
      const adminToggle = screen.getByText('عرض أدوات المسؤول');
      fireEvent.click(adminToggle);

      await waitFor(() => {
        expect(screen.getByText('حذف')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByText('حذف');
      fireEvent.click(deleteButtons[0]);

      expect(mockedAxios.delete).not.toHaveBeenCalled();
    });

    it('should handle deletion error gracefully', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Network error'));
      
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      // Enable admin view
      const adminToggle = screen.getByText('عرض أدوات المسؤول');
      fireEvent.click(adminToggle);

      await waitFor(() => {
        expect(screen.getByText('حذف')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByText('حذف');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('حدث خطأ أثناء حذف المنتج');
      });
    });
  });

  describe('Navigation Links', () => {
    it('should have add new product link', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('إضافة منتج جديد +')).toBeInTheDocument();
      });

      const addLink = screen.getByText('إضافة منتج جديد +');
      expect(addLink.closest('a')).toHaveAttribute('href', '/products/new');
    });

    it('should have edit links for products when admin view is active', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('كرسي')).toBeInTheDocument();
      });

      // Enable admin view
      const adminToggle = screen.getByText('عرض أدوات المسؤول');
      fireEvent.click(adminToggle);

      await waitFor(() => {
        const editButtons = screen.getAllByText('تحرير');
        expect(editButtons[0].closest('a')).toHaveAttribute('href', '/products/1/edit');
        expect(editButtons[1].closest('a')).toHaveAttribute('href', '/products/2/edit');
      });
    });
  });

  describe('Product Tags Display', () => {
    it('should display product tags correctly', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('مريح')).toBeInTheDocument();
        expect(screen.getByText('خشبي')).toBeInTheDocument();
        expect(screen.getByText('قوي')).toBeInTheDocument();
      });
    });
  });

  describe('Price and Profit Display', () => {
    it('should display prices and profits with correct formatting', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        // Check cost prices
        expect(screen.getByText('$50.00')).toBeInTheDocument();
        expect(screen.getByText('$200.00')).toBeInTheDocument();
        
        // Check selling prices
        expect(screen.getByText('$100.00')).toBeInTheDocument();
        expect(screen.getByText('$350.00')).toBeInTheDocument();
        
        // Check profit percentages
        expect(screen.getByText('100.0%')).toBeInTheDocument();
        expect(screen.getByText('75.0%')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));
      
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      // Should still show loading initially
      expect(screen.getByText('جاري تحميل المنتجات...')).toBeInTheDocument();
      
      // After error, loading should stop
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل المنتجات...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Product Order', () => {
    it('should display products in reverse order (newest first)', async () => {
      render(<ProductOverview />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        const productRows = screen.getAllByRole('row');
        // Skip header row, get data rows
        const dataRows = productRows.slice(1);
        
        // Check that the second product (id: 2) appears first in the table
        expect(within(dataRows[0]).getByText('2')).toBeInTheDocument();
        expect(within(dataRows[1]).getByText('1')).toBeInTheDocument();
      });
    });
  });
});



