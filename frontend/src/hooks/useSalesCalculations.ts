import { useMemo } from 'react';
import type { Sale, SaleItem, Product } from '@/types/product';

interface SalesCalculations {
  subtotal: number;
  totalCost: number;
  discountAmount: number;
  taxAmount: number;
  finalTotal: number;
  netProfit: number;
  profitPercentage: number;
}

export const useSalesCalculations = (
  formData: Partial<Sale>,
  products: Product[]
): SalesCalculations => {
  
  return useMemo(() => {
    // Helper functions
    const getSaleItems = (): SaleItem[] => {
      return formData.items || [];
    };

    const findProductById = (productId: number): Product | undefined => {
      return products.find(product => product.id === productId);
    };

    const calculateItemSubtotal = (item: SaleItem): number => {
      return item.quantity * item.unit_price;
    };

    const calculateItemCost = (item: SaleItem): number => {
      const product = findProductById(item.product);
      if (!product) {
        return 0;
      }
      
      return item.quantity * product.cost_price;
    };

    // Main calculations
    const items = getSaleItems();
    
    const subtotal = items.reduce((sum, item) => {
      return sum + calculateItemSubtotal(item);
    }, 0);

    const totalCost = items.reduce((sum, item) => {
      return sum + calculateItemCost(item);
    }, 0);

    const discountAmount = formData.discount_amount || 0;
    const taxPercentage = formData.tax_percentage || 0;
    
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercentage) / 100;
    
    const finalTotal = subtotal - discountAmount + taxAmount;
    const netProfit = finalTotal - totalCost;
    
    const profitPercentage = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    return {
      subtotal,
      totalCost,
      discountAmount,
      taxAmount,
      finalTotal,
      netProfit,
      profitPercentage
    };
  }, [formData, products]);
};
