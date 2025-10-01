import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SaleForm } from '../pages/SaleForm';
import type { Product } from '@/types/product';

// Mock the services
vi.mock('../services/saleService', () => ({
  SalesService: {
    createSale: vi.fn(),
    updateSale: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  };
});

// Mock hooks
vi.mock('../hooks/useSales', () => ({
  useAvailableProducts: vi.fn(),
  useSale: vi.fn(),
}));

vi.mock('../hooks/useSalesCalculations', () => ({
  useSalesCalculations: vi.fn(),
}));

const mockProducts: Product[] = [
  {
    id: 1,
    type: 1,
    type_name_ar: 'قميص',
    type_name_en: 'Shirt',
    brand: 1,
    brand_name_ar: 'ماركة 1',
    brand_name_en: 'Brand 1',
    material: null,
    material_name_ar: null,
    material_name_en: null,
    cost_price: 10,
    selling_price: 15,
    size: 'M',
    weight: null,
    tags: '',
    tags_list: [],
    profit: 5,
    profit_percentage: 50,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: 1,
    available_stock: 100,
    is_low_stock: false,
    is_active: true,
  },
  {
    id: 2,
    type: 1,
    type_name_ar: 'بنطال',
    type_name_en: 'Pants',
    brand: 1,
    brand_name_ar: 'ماركة 2',
    brand_name_en: 'Brand 2',
    material: null,
    material_name_ar: null,
    material_name_en: null,
    cost_price: 20,
    selling_price: 30,
    size: 'L',
    weight: null,
    tags: '',
    tags_list: [],
    profit: 10,
    profit_percentage: 50,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: 1,
    available_stock: 50,
    is_low_stock: false,
    is_active: true,
  },
];

describe('SaleForm', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { useAvailableProducts, useSale } = await import('../hooks/useSales');
    const { useSalesCalculations } = await import('../hooks/useSalesCalculations');

    // Mock useAvailableProducts
    vi.mocked(useAvailableProducts).mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    // Mock useSale
    vi.mocked(useSale).mockReturnValue({
      sale: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
      setSale: vi.fn()
    });

    // Mock useSalesCalculations
    vi.mocked(useSalesCalculations).mockReturnValue({
      subtotal: 0,
      totalCost: 0,
      discountAmount: 0,
      taxAmount: 0,
      finalTotal: 0,
      netProfit: 0,
      profitPercentage: 0,
    });
  });

  it('renders the sale form', () => {
    /**
     * Test: Verify that the SaleForm component renders correctly
     *
     * Given: A new sale form
     * When: The component is rendered
     * Then: The page title "بيعة جديدة" (New Sale) should be visible
     */
    render(
      <BrowserRouter>
        <SaleForm />
      </BrowserRouter>
    );

    expect(screen.getByText('بيعة جديدة')).toBeInTheDocument();
  });

  it('disables submit button when no items', () => {
    /**
     * Test: Verify submit button is disabled when basket is empty
     *
     * Given: A sale form with no items
     * When: The component renders
     * Then: The submit button should be disabled
     *
     * This prevents users from accidentally submitting invalid sales.
     */
    render(
      <BrowserRouter>
        <SaleForm />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /حفظ البيعة/i });
    expect(submitButton).toBeDisabled();
  });

  it('displays quick product selection buttons', () => {
    /**
     * Test: Verify quick product selection UI elements are displayed
     *
     * Given: A sale form with available products
     * When: The component renders
     * Then: Quick selection buttons should show product names from the first 10 products
     *
     * This tests the QuickSale-inspired feature that allows rapid product selection.
     */
    render(
      <BrowserRouter>
        <SaleForm />
      </BrowserRouter>
    );

    expect(screen.getByText('قميص')).toBeInTheDocument();
    expect(screen.getByText('بنطال')).toBeInTheDocument();
  });

  it('displays empty basket message when no items', () => {
    /**
     * Test: Verify empty state message is shown when basket has no items
     *
     * Given: A sale form with no items in the basket
     * When: The component renders
     * Then: The message "السلة فارغة" (Basket is empty) should be displayed
     *
     * This provides clear user feedback about the current state of the sale.
     */
    render(
      <BrowserRouter>
        <SaleForm />
      </BrowserRouter>
    );

    expect(screen.getByText('السلة فارغة')).toBeInTheDocument();
  });

  it('shows optional information section when toggled', () => {
    /**
     * Test: Verify optional information toggle functionality
     *
     * Given: A sale form with optional information initially hidden
     * When: User clicks the "عرض المعلومات الاختيارية" button
     * Then: Customer information and payment settings sections should become visible
     *
     * This tests the collapsible UI pattern for optional form fields.
     */
    render(
      <BrowserRouter>
        <SaleForm />
      </BrowserRouter>
    );

    // Optional info should be hidden initially
    expect(screen.queryByText('معلومات العميل')).not.toBeInTheDocument();

    // Click the toggle button
    const toggleButton = screen.getByRole('button', {
      name: /عرض المعلومات الاختيارية/i
    });
    fireEvent.click(toggleButton);

    // Optional info should now be visible
    expect(screen.getByText('معلومات العميل')).toBeInTheDocument();
    expect(screen.getByText('إعدادات الدفع والخصومات')).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    /**
     * Test: Verify loading state is displayed while fetching data
     *
     * Given: Products are being loaded
     * When: The component renders with loading=true
     * Then: A loading message "جاري التحميل..." should be displayed
     *
     * This ensures users receive feedback during asynchronous operations.
     */
    const { useAvailableProducts } = await import('../hooks/useSales');

    vi.mocked(useAvailableProducts).mockReturnValue({
      products: [],
      loading: true,
      error: null,
      refetch: vi.fn()
    });

    render(
      <BrowserRouter>
        <SaleForm />
      </BrowserRouter>
    );

    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
  });
});
