import React from 'react';

interface SaleSummaryProps {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  finalTotal: number;
  totalCost: number;
  netProfit: number;
  profitPercentage: number;
}

export const SaleSummary: React.FC<SaleSummaryProps> = ({
  subtotal,
  discountAmount,
  taxAmount,
  finalTotal,
  totalCost,
  netProfit,
  profitPercentage
}) => {
  const formatCurrency = (amount: number) => {
    return isNaN(amount) ? '—' : `$${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">ملخص البيعة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>المجموع الفرعي:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>الخصم:</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>الضريبة:</span>
            <span>+{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 gap-8">
            <span>الإجمالي النهائي:</span>
            <span>{formatCurrency(finalTotal)}</span>
          </div>
        </div>

        <div className="space-y-2 bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">معلومات الربح</h4>
          <div className="flex justify-between text-sm">
            <span>إجمالي التكلفة:</span>
            <span>{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>صافي الربح:</span>
            <span className={`font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>نسبة الربح:</span>
            <span className={`font-semibold ${profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};