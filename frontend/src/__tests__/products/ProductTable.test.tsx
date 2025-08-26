
// __tests__/products/ProductTable.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductTable from '@/components/products/ProductTable';
import type { Product } from '@/types/product';

const mockProducts: Product[] = [
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
    tags_list: ['مريح', 'خشبي']
  }
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ProductTable Component', () => {
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  it('should render table headers correctly', () => {
    render(
      <ProductTable products={mockProducts} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('رقم تعريفي')).toBeInTheDocument();
    expect(screen.getByText('النوع')).toBeInTheDocument();
    expect(screen.getByText('العلامة التجارية')).toBeInTheDocument();
    expect(screen.getByText('الحجم')).toBeInTheDocument();
    expect(screen.getByText('سعر التكلفة')).toBeInTheDocument();
    expect(screen.getByText('سعر البيع')).toBeInTheDocument();
    expect(screen.getByText('الربح')).toBeInTheDocument();
    expect(screen.getByText('نسبة الربح')).toBeInTheDocument();
    expect(screen.getByText('الوسوم')).toBeInTheDocument();
  });

  it('should not show admin actions header when adminView is false', () => {
    render(
      <ProductTable products={mockProducts} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: TestWrapper }
    );

    expect(screen.queryByText('الإجراءات')).not.toBeInTheDocument();
  });

  it('should show admin actions header when adminView is true', () => {
    render(
      <ProductTable products={mockProducts} adminView={true} onDelete={mockOnDelete} />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('الإجراءات')).toBeInTheDocument();
  });

  it('should render product data correctly', () => {
    render(
      <ProductTable products={mockProducts} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('كرسي')).toBeInTheDocument();
    expect(screen.getByText('ايكيا')).toBeInTheDocument();
    expect(screen.getByText('متوسط')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('should show empty state when no products', () => {
    render(
      <ProductTable products={[]} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('لا توجد منتجات مطابقة للبحث')).toBeInTheDocument();
  });

  it('should show admin actions when adminView is true', () => {
    render(
      <ProductTable products={mockProducts} adminView={true} onDelete={mockOnDelete} />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('تحرير')).toBeInTheDocument();
    expect(screen.getByText('حذف')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', () => {
    render(
      <ProductTable products={mockProducts} adminView={true} onDelete={mockOnDelete} />,
      { wrapper: TestWrapper }
    );

    const deleteButton = screen.getByText('حذف');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('should have correct edit link', () => {
    render(
      <ProductTable products={mockProducts} adminView={true} onDelete={mockOnDelete} />,
      { wrapper: TestWrapper }
    );

    const editLink = screen.getByText('تحرير');
    expect(editLink.closest('a')).toHaveAttribute('href', '/products/1/edit');
  });
});