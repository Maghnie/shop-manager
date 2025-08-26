import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useProducts } from '@/hooks/useProducts';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  }
}));

const mockedAxios = axios as any;

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

describe('useProducts Hook', () => {
  beforeEach(() => {
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
    expect(result.current.filteredProducts).toEqual([]);
  });

  it('should fetch and set data correctly', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.productTypes).toEqual(mockProductTypes);
    expect(result.current.brands).toEqual(mockBrands);
    expect(result.current.materials).toEqual(mockMaterials);
  });

  it('should reverse product order in filteredProducts', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Products should be reversed (newest first)
    expect(result.current.filteredProducts[0].id).toBe(2);
    expect(result.current.filteredProducts[1].id).toBe(1);
  });

  it('should filter by search term', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ search: 'كرسي', type: '', brand: '', material: '' });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0].type_name_ar).toBe('كرسي');
    });
  });

  it('should filter by type', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ search: '', type: 'كرسي', brand: '', material: '' });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0].type_name_ar).toBe('كرسي');
    });
  });

  it('should filter by brand', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ search: '', type: '', brand: '2', material: '' });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0].brand_name_ar).toBe(2);
    });
  });

  it('should filter by material', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ search: '', type: '', brand: '', material: '1' });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(2); // Both products have material 1
    });
  });

  it('should combine multiple filters', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ search: 'كرسي', type: '', brand: 'ايكيا', material: '' });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0].type_name_ar).toBe('كرسي');
      expect(result.current.filteredProducts[0].brand_name_ar).toBe('ايكيا');
    });
  });

  it('should search in multiple fields', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Search by English type name
    act(() => {
      result.current.setFilters({ search: 'Chair', type: '', brand: '', material: '' });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0].type_name_en).toBe('Chair');
    });

    // Search by brand name
    act(() => {
      result.current.setFilters({ search: 'ايكيا', type: '', brand: '', material: '' });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0].brand_name_ar).toBe('ايكيا');
    });

    // Search by tags
    act(() => {
      result.current.setFilters({ search: 'مريح', type: '', brand: '', material: '' });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0].tags_list).toContain('مريح');
    });
  });

  it('should handle case-insensitive search', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ search: 'chair', type: '', brand: '', material: '' });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0].type_name_en).toBe('Chair');
    });
  });

  it('should allow updating products list', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newProductsList = [mockProducts[0]]; // Only first product

    act(() => {
      result.current.setProducts(newProductsList);
    });

    expect(result.current.products).toEqual(newProductsList);
    expect(result.current.filteredProducts).toHaveLength(1);
  });

  it.skip('should handle API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still have empty arrays
    expect(result.current.products).toEqual([]);
    expect(result.current.productTypes).toEqual([]);
    expect(result.current.brands).toEqual([]);
    expect(result.current.materials).toEqual([]);
  });
});
