
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductFilters from '@/components/products/ProductFilters';
import type { Filters } from '@/types/product';

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

describe('ProductFilters Component', () => {
  const defaultFilters: Filters = {
    search: '',
    type: '',
    brand: '',
    material: ''
  };

  const mockSetFilters = vi.fn();

  beforeEach(() => {
    mockSetFilters.mockClear();
  });

  it('should render all filter inputs', () => {
    render(
      <ProductFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        productTypes={mockProductTypes}
        brands={mockBrands}
        materials={mockMaterials}
      />
    );

    expect(screen.getByPlaceholderText('ابحث في المنتجات...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('جميع الأنواع')).toBeInTheDocument();
    expect(screen.getByDisplayValue('جميع العلامات التجارية')).toBeInTheDocument();
    expect(screen.getByDisplayValue('جميع المواد')).toBeInTheDocument();
  });

  it('should update search filter when typing', () => {
    render(
      <ProductFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        productTypes={mockProductTypes}
        brands={mockBrands}
        materials={mockMaterials}
      />
    );

    const searchInput = screen.getByPlaceholderText('ابحث في المنتجات...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should update type filter when selected', () => {
    render(
      <ProductFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        productTypes={mockProductTypes}
        brands={mockBrands}
        materials={mockMaterials}
      />
    );

    const typeSelect = screen.getByDisplayValue('جميع الأنواع');
    fireEvent.change(typeSelect, { target: { value: '1' } });

    expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should update brand filter when selected', () => {
    render(
      <ProductFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        productTypes={mockProductTypes}
        brands={mockBrands}
        materials={mockMaterials}
      />
    );

    const brandSelect = screen.getByDisplayValue('جميع العلامات التجارية');
    fireEvent.change(brandSelect, { target: { value: '2' } });

    expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should update material filter when selected', () => {
    render(
      <ProductFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        productTypes={mockProductTypes}
        brands={mockBrands}
        materials={mockMaterials}
      />
    );

    const materialSelect = screen.getByDisplayValue('جميع المواد');
    fireEvent.change(materialSelect, { target: { value: '1' } });

    expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should display current filter values', () => {
    const activeFilters: Filters = {
      search: 'test',
      type: '1',
      brand: '2',
      material: '1'
    };

    render(
      <ProductFilters
        filters={activeFilters}
        setFilters={mockSetFilters}
        productTypes={mockProductTypes}
        brands={mockBrands}
        materials={mockMaterials}
      />
    );

    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  it('should render all product type options', () => {
    render(
      <ProductFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        productTypes={mockProductTypes}
        brands={mockBrands}
        materials={mockMaterials}
      />
    );

    mockProductTypes.forEach(type => {
      expect(screen.getByText(type.name_ar)).toBeInTheDocument();
    });
  });

  it('should render all brand options', () => {
    render(
      <ProductFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        productTypes={mockProductTypes}
        brands={mockBrands}
        materials={mockMaterials}
      />
    );

    mockBrands.forEach(brand => {
      expect(screen.getByText(brand.name_ar)).toBeInTheDocument();
    });
  });

  it('should render all material options', () => {
    render(
      <ProductFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        productTypes={mockProductTypes}
        brands={mockBrands}
        materials={mockMaterials}
      />
    );

    mockMaterials.forEach(material => {
      expect(screen.getByText(material.name_ar)).toBeInTheDocument();
    });
  });
});