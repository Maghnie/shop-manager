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
    // Return zero calculations if products aren't loaded yet
    if (!products.length) {
      return {
        subtotal: 0,
        totalCost: 0,
        discountAmount: formData.discount_amount || 0,
        taxAmount: 0,
        finalTotal: 0,
        netProfit: 0,
        profitPercentage: 0
      };
    }

    const items = formData.items || [];
    
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const totalCost = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product);
      if (!product) return sum;
      return sum + (item.quantity * product.cost_price);
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