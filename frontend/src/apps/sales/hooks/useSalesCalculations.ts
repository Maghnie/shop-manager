import { useMemo } from 'react';
import type { Sale, SaleItem, Product } from '@/types/product';

interface SalesCalculations {
  subtotal: number;
  totalCost: number;
  discountAmount: number;
  taxAmount: number;
  finalTotal: number;
  netProfit: number;
  profitMargin: number;
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
        profitMargin: 0,
        profitPercentage: 0
      };
    }
    
    console.log("there are x products: ", products.length)
    const items = formData.items || [];

    if (items.length > 0){
      console.log("there are x formData.items: ", items.length)
      console.log("item at 0: ", items[0])
    }

    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    console.log("subtotal:", subtotal)

    const totalCost = items.reduce((sum, item) => {
      return sum + (item.quantity * item.cost_price);
    }, 0);
    console.log("total cost:", totalCost)

    const discountAmount = formData.discount_amount || 0;
    const taxPercentage = formData.tax_percentage || 0;
    
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercentage) / 100;
    
    const finalTotal = subtotal - discountAmount + taxAmount;
    const netProfit = finalTotal - totalCost;
    
    const profitMargin = totalCost > 0 ? (netProfit / finalTotal) * 100 : 0;
    const profitPercentage = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    return {
      subtotal,
      totalCost,
      discountAmount,
      taxAmount,
      finalTotal,
      netProfit,
      profitMargin,
      profitPercentage
    };
  }, [formData, products]);
};