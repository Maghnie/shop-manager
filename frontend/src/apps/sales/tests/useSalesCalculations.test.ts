import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSalesCalculations } from '../hooks/useSalesCalculations';
import type { Sale, Product } from '@/types/product';

describe('useSalesCalculations', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      type: 1,
      type_name_ar: 'نوع 1',
      type_name_en: 'Type 1',
      brand: 1,
      brand_name_ar: 'علامة 1',
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
      type_name_ar: 'نوع 2',
      type_name_en: 'Type 2',
      brand: 1,
      brand_name_ar: 'علامة 2',
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

  it('calculates totals correctly with no discount and no tax', () => {
    /**
     * Test: Basic sales calculation without discount or tax
     *
     * Given: A sale with 2 items:
     *        - Product 1: quantity=2, unit_price=15, cost_price=10
     *        - Product 2: quantity=1, unit_price=30, cost_price=20
     *        No discount, no tax
     *
     * When: Calculations are performed
     *
     * Then: Expected results:
     *       - Subtotal: (2 × 15) + (1 × 30) = 60
     *       - Total Cost: (2 × 10) + (1 × 20) = 40
     *       - Discount: 0
     *       - Tax: 0
     *       - Final Total: 60
     *       - Net Profit: 60 - 40 = 20
     *       - Profit %: (20 / 40) × 100 = 50%
     */
    const saleData: Partial<Sale> = {
      discount_amount: 0,
      tax_percentage: 0,
      items: [
        { product: 1, quantity: 2, unit_price: 15, cost_price: 10 },
        { product: 2, quantity: 1, unit_price: 30, cost_price: 20 },
      ],
    };

    const { result } = renderHook(() => useSalesCalculations(saleData, mockProducts));

    expect(result.current.subtotal).toBe(60);
    expect(result.current.totalCost).toBe(40);
    expect(result.current.discountAmount).toBe(0);
    expect(result.current.taxAmount).toBe(0);
    expect(result.current.finalTotal).toBe(60);
    expect(result.current.netProfit).toBe(20);
    expect(result.current.profitPercentage).toBe(50);
  });

  it('calculates totals correctly with discount', () => {
    /**
     * Test: Sales calculation with discount applied
     *
     * Given: A sale with 1 item and a discount of 10
     *        - Product 1: quantity=2, unit_price=15
     *        - Discount: 10
     *
     * When: Calculations are performed
     *
     * Then: Expected results:
     *       - Subtotal: 2 × 15 = 30
     *       - Discount Applied: 10
     *       - Final Total: 30 - 10 = 20
     *
     * This verifies that flat discount amounts are correctly subtracted from subtotal.
     */
    const saleData: Partial<Sale> = {
      discount_amount: 10,
      tax_percentage: 0,
      items: [
        { product: 1, quantity: 2, unit_price: 15, cost_price: 10 },
      ],
    };

    const { result } = renderHook(() => useSalesCalculations(saleData, mockProducts));

    expect(result.current.subtotal).toBe(30);
    expect(result.current.discountAmount).toBe(10);
    expect(result.current.finalTotal).toBe(20);
  });

  it('calculates totals correctly with tax', () => {
    /**
     * Test: Sales calculation with tax percentage
     *
     * Given: A sale with 1 item and 15% tax
     *        - Product 1: quantity=2, unit_price=15
     *        - Tax: 15%
     *
     * When: Calculations are performed
     *
     * Then: Expected results:
     *       - Subtotal: 2 × 15 = 30
     *       - Tax Amount: 30 × 0.15 = 4.50
     *       - Final Total: 30 + 4.50 = 34.50
     *
     * This verifies that tax is calculated as a percentage of the subtotal.
     */
    const saleData: Partial<Sale> = {
      discount_amount: 0,
      tax_percentage: 15,
      items: [
        { product: 1, quantity: 2, unit_price: 15, cost_price: 10 },
      ],
    };

    const { result } = renderHook(() => useSalesCalculations(saleData, mockProducts));

    expect(result.current.subtotal).toBe(30);
    expect(result.current.taxAmount).toBe(4.5);
    expect(result.current.finalTotal).toBe(34.5);
  });

  it('calculates totals correctly with both discount and tax', () => {
    /**
     * Test: Sales calculation with both discount and tax
     *
     * Given: A sale with discount and tax:
     *        - Product 1: quantity=2, unit_price=15, cost_price=10
     *        - Discount: 5
     *        - Tax: 10%
     *
     * When: Calculations are performed
     *
     * Then: Expected results:
     *       - Subtotal: 2 × 15 = 30
     *       - Discount: 5
     *       - Discounted Amount: 30 - 5 = 25
     *       - Tax: 25 × 0.10 = 2.50 (tax applied AFTER discount)
     *       - Final Total: 25 + 2.50 = 27.50
     *       - Total Cost: 2 × 10 = 20
     *       - Net Profit: 27.50 - 20 = 7.50
     *       - Profit %: (7.50 / 20) × 100 = 37.5%
     *
     * This confirms the order of operations: discount first, then tax on discounted amount.
     */
    const saleData: Partial<Sale> = {
      discount_amount: 5,
      tax_percentage: 10,
      items: [
        { product: 1, quantity: 2, unit_price: 15, cost_price: 10 },
      ],
    };

    const { result } = renderHook(() => useSalesCalculations(saleData, mockProducts));

    expect(result.current.subtotal).toBe(30);
    expect(result.current.discountAmount).toBe(5);
    expect(result.current.taxAmount).toBe(2.5);
    expect(result.current.finalTotal).toBe(27.5);
    expect(result.current.totalCost).toBe(20);
    expect(result.current.netProfit).toBe(7.5);
    expect(result.current.profitPercentage).toBe(37.5);
  });

  it('handles empty items array', () => {
    /**
     * Test: Calculation with no items (edge case)
     *
     * Given: A sale with an empty items array
     *
     * When: Calculations are performed
     *
     * Then: All totals should be 0:
     *       - Subtotal: 0
     *       - Total Cost: 0
     *       - Final Total: 0
     *       - Net Profit: 0
     *       - Profit %: 0
     *
     * This ensures the hook handles empty state gracefully without errors.
     */
    const saleData: Partial<Sale> = {
      discount_amount: 0,
      tax_percentage: 0,
      items: [],
    };

    const { result } = renderHook(() => useSalesCalculations(saleData, mockProducts));

    expect(result.current.subtotal).toBe(0);
    expect(result.current.totalCost).toBe(0);
    expect(result.current.finalTotal).toBe(0);
    expect(result.current.netProfit).toBe(0);
    expect(result.current.profitPercentage).toBe(0);
  });

  it('handles missing product data gracefully', () => {
    /**
     * Test: Calculation with non-existent product ID
     *
     * Given: A sale item referencing a product ID (999) that doesn't exist in mockProducts
     *
     * When: Calculations are performed
     *
     * Then: Calculation should use the prices provided in the SaleItem:
     *       - Subtotal: 15 (from unit_price)
     *       - Total Cost: 10 (from cost_price)
     *
     * This ensures the hook is resilient to data inconsistencies and uses
     * item-level prices as fallback.
     */
    const saleData: Partial<Sale> = {
      discount_amount: 0,
      tax_percentage: 0,
      items: [
        { product: 999, quantity: 1, unit_price: 15, cost_price: 10 },
      ],
    };

    const { result } = renderHook(() => useSalesCalculations(saleData, mockProducts));

    expect(result.current.subtotal).toBe(15);
    expect(result.current.totalCost).toBe(10);
  });

  it('handles zero cost price for profit calculation', () => {
    /**
     * Test: Division by zero protection in profit percentage
     *
     * Given: A sale item with zero cost price:
     *        - Product 1: quantity=1, unit_price=15, cost_price=0
     *
     * When: Profit percentage is calculated
     *
     * Then: Should handle division by zero gracefully:
     *       - Total Cost: 0
     *       - Net Profit: 15
     *       - Profit %: 0 (to avoid division by zero error)
     *
     * This prevents runtime errors when cost price data is missing or zero.
     */
    const saleData: Partial<Sale> = {
      discount_amount: 0,
      tax_percentage: 0,
      items: [
        { product: 1, quantity: 1, unit_price: 15, cost_price: 0 },
      ],
    };

    const { result } = renderHook(() => useSalesCalculations(saleData, mockProducts));

    expect(result.current.totalCost).toBe(0);
    expect(result.current.netProfit).toBe(15);
    expect(result.current.profitPercentage).toBe(0);
  });

  it('recalculates when sale data changes', () => {
    /**
     * Test: Hook reactivity to data changes
     *
     * Given: Initial sale data with quantity=1
     *
     * When: Sale data is updated to quantity=2
     *
     * Then: Calculations should automatically update:
     *       - Initial subtotal: 15
     *       - Updated subtotal: 30
     *
     * This verifies that the hook properly re-runs calculations when
     * input data changes (React hooks dependency array).
     */
    const initialSaleData: Partial<Sale> = {
      discount_amount: 0,
      tax_percentage: 0,
      items: [
        { product: 1, quantity: 1, unit_price: 15, cost_price: 10 },
      ],
    };

    const { result, rerender } = renderHook(
      ({ saleData }) => useSalesCalculations(saleData, mockProducts),
      { initialProps: { saleData: initialSaleData } }
    );

    expect(result.current.subtotal).toBe(15);

    const updatedSaleData: Partial<Sale> = {
      ...initialSaleData,
      items: [
        { product: 1, quantity: 2, unit_price: 15, cost_price: 10 },
      ],
    };

    rerender({ saleData: updatedSaleData });

    expect(result.current.subtotal).toBe(30);
  });
});
