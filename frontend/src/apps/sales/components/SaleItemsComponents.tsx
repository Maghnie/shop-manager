import React, { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { SaleItem } from '@/types/product';

interface Product {
  id: number;
  type_name_ar: string;
  selling_price: number;
  cost_price: number;
  available_stock: number;
  is_low_stock: boolean;
}

interface SaleItemRowProps {
  item: SaleItem;
  index: number;
  products: Product[];
  onUpdate: (index: number, updatedItem: SaleItem) => void;
  onRemove: (index: number) => void;
  onAddNew: () => void;
  canRemove: boolean;
}

const SaleItemRow: React.FC<SaleItemRowProps> = ({
  item,
  index,
  products,
  onUpdate,
  onRemove,
  onAddNew,
  canRemove
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const quantityRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  
  const product = products.find(p => p.id === item.product);
  const costPrice = product?.cost_price || 0;
  const unitPrice = item.unit_price || 0;
  const quantity = item.quantity || 0;
  
  // Calculations
  const itemTotal = unitPrice * quantity;
  const totalCost = costPrice * quantity;
  const profit = itemTotal - totalCost;
  const profitPercentage = itemTotal > 0 ? (profit / itemTotal) * 100 : 0;

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === parseInt(productId));
    if (selectedProduct) {
      onUpdate(index, {
        ...item,
        product: selectedProduct.id,
        unit_price: selectedProduct.selling_price
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'quantity' && priceRef.current) {
        priceRef.current.focus();
      } else if (field === 'price') {
        onAddNew();
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Main row */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Product Select */}
        <div className="col-span-5">
          <select
            value={item.product || ''}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">اختر منتج...</option>
            {products.map(product => (
              <option 
                key={product.id} 
                value={product.id} 
                disabled={product.available_stock === 0}
              >
                {product.type_name_ar} - المتوفر: {product.available_stock}
                {product.is_low_stock && ' ⚠️'}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className="col-span-2">
          <input
            ref={quantityRef}
            type="number"
            min="1"
            value={item.quantity || ''}
            onChange={(e) => onUpdate(index, { ...item, quantity: parseInt(e.target.value) || 0 })}
            onKeyPress={(e) => handleKeyPress(e, 'quantity')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            placeholder="كمية"
          />
        </div>

        {/* Unit Price */}
        <div className="col-span-2">
          <input
            ref={priceRef}
            type="number"
            min="0"
            step="0.01"
            value={item.unit_price || ''}
            onChange={(e) => onUpdate(index, { ...item, unit_price: parseFloat(e.target.value) || 0 })}
            onKeyPress={(e) => handleKeyPress(e, 'price')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            placeholder="سعر"
          />
        </div>

        {/* Total */}
        <div className="col-span-2 text-center">
          <div className="font-semibold text-sm">${itemTotal.toFixed(2)}</div>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex justify-center space-x-1">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
            title="تفاصيل الربح"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stock Warning */}
      {product && item.quantity > product.available_stock && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          ⚠️ الكمية المطلوبة ({item.quantity}) تتجاوز المخزون المتاح ({product.available_stock})
        </div>
      )}

      {/* Profit Details */}
      {showDetails && product && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
          <h4 className="font-medium text-gray-800 text-sm mb-2">تفاصيل الربح</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">سعر التكلفة:</span>
                <span>${costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">السعر الإجمالي:</span>
                <span>${itemTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">إجمالي التكلفة:</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الربح:</span>
                <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profit.toFixed(2)} ({profitPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SaleItemsListProps {
  items: SaleItem[];
  products: Product[];
  onUpdateItem: (index: number, updatedItem: SaleItem) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: () => void;
}

export const SaleItemsList: React.FC<SaleItemsListProps> = ({
  items,
  products,
  onUpdateItem,
  onRemoveItem,
  onAddItem
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">المنتجات</h3>
        <button
          type="button"
          onClick={onAddItem}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منتج</span>
        </button>
      </div>

      {/* Column Headers */}
      <div className="bg-gray-100 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-700">
          <div className="col-span-5">المنتج</div>
          <div className="col-span-2 text-center">الكمية</div>
          <div className="col-span-2 text-center">السعر</div>
          <div className="col-span-2 text-center">المجموع</div>
          <div className="col-span-1 text-center">إجراءات</div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <SaleItemRow
            key={index}
            item={item}
            index={index}
            products={products}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
            onAddNew={onAddItem}
            canRemove={items.length > 1}
          />
        ))}
      </div>
    </div>
  );
};