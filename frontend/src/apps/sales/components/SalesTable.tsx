import React from 'react';
import { X } from 'lucide-react';
import type { Product, SaleItem } from '@/types/product';

interface SalesTableProps {
  items: SaleItem[];
  products: Product[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdatePrice: (index: number, price: number) => void;
  onRemoveItem: (index: number) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({
  items,
  products,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
}) => {
  const getProductName = (id: number) => products.find(p => p.id === id)?.type_name_ar || 'غير معروف';

  return (
    <table className="min-w-full border border-gray-200 mt-4">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 border">المنتج</th>
          <th className="px-4 py-2 border">الكمية</th>
          <th className="px-4 py-2 border">السعر</th>
          <th className="px-4 py-2 border">الإجمالي</th>
          <th className="px-4 py-2 border">حذف</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index} className="border-t">
            <td className="px-4 py-2 border">{getProductName(item.product)}</td>
            <td className="px-4 py-2 border">
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value, 10) || 1)}
                className="w-16 border rounded p-1 text-center"
              />
            </td>
            <td className="px-4 py-2 border">
              <input
                type="number"
                value={item.unit_price}
                onChange={(e) => onUpdatePrice(index, parseFloat(e.target.value) || 0)}
                className="w-20 border rounded p-1 text-center"
              />
            </td>
            <td className="px-4 py-2 border">{(item.quantity * item.unit_price).toFixed(2)}</td>
            <td className="px-4 py-2 border text-center">
              <button onClick={() => onRemoveItem(index)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
