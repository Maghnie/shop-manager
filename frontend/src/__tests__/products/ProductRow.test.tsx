import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductRow from '@/components/products/ProductRow';
import type { Product } from '@/types/product';

const mockProduct: Product = {
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
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <table><tbody>{children}</tbody></table>
);

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter><TestWrapper>{children}</TestWrapper></BrowserRouter>
);

describe('ProductRow Component', () => {
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  it('should render product data correctly', () => {
    render(
      <ProductRow product={mockProduct} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: RouterWrapper }
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('كرسي')).toBeInTheDocument();
    expect(screen.getByText('ايكيا')).toBeInTheDocument();
    expect(screen.getByText('متوسط')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('should handle missing brand gracefully', () => {
    const productWithoutBrand = { ...mockProduct, brand_name_ar: null };
    render(
      <ProductRow product={productWithoutBrand} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: RouterWrapper }
    );

    expect(screen.getByText('غير محدد')).toBeInTheDocument();
  });

  it('should handle missing size gracefully', () => {
    const productWithoutSize = { ...mockProduct, size: null };
    render(
      <ProductRow product={productWithoutSize} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: RouterWrapper }
    );

    expect(screen.getByText('غير محدد')).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    render(
      <ProductRow product={mockProduct} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: RouterWrapper }
    );

    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('should handle invalid currency values', () => {
    const productWithInvalidPrice = { ...mockProduct, cost_price: 'invalid' as any };
    render(
      <ProductRow product={productWithInvalidPrice} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: RouterWrapper }
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should not show admin actions when adminView is false', () => {
    render(
      <ProductRow product={mockProduct} adminView={false} onDelete={mockOnDelete} />,
      { wrapper: RouterWrapper }
    );

    expect(screen.queryByText('تحرير')).not.toBeInTheDocument();
    expect(screen.queryByText('حذف')).not.toBeInTheDocument();
  });

  it('should show admin actions when adminView is true', () => {
    render(
      <ProductRow product={mockProduct} adminView={true} onDelete={mockOnDelete} />,
      { wrapper: RouterWrapper }
    );

    expect(screen.getByText('تحرير')).toBeInTheDocument();
    expect(screen.getByText('حذف')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', () => {
    render(
      <ProductRow product={mockProduct} adminView={true} onDelete={mockOnDelete} />,
      { wrapper: RouterWrapper }
    );

    const deleteButton = screen.getByText('حذف');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('should have correct edit link', () => {
    render(
      <ProductRow product={mockProduct} adminView={true} onDelete={mockOnDelete} />,
      { wrapper: RouterWrapper }
    );

    const editLink = screen.getByText('تحرير');
    expect(editLink.closest('a')).toHaveAttribute('href', '/products/1/edit');
  });
});