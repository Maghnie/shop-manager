import React, { useState, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { Search, Package } from 'lucide-react';
import type { Product } from '@/types/product';

interface ProductInputProps {
  products: Product[];
  onAddProduct: (productId: number, quantity?: number) => void;
}

interface ProductOption {
  id: number;
  label: string;
  product: Product;
}

export const ProductInput: React.FC<ProductInputProps> = ({
  products,
  onAddProduct
}) => {
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);

  // Create product options
  const productOptions: ProductOption[] = products.map(product => ({
    id: product.id,
    label: `${product.type_name_ar} ${product.brand_name_ar} (المتوفر: ${product.available_stock})`,
    product
  }));

  // Filter options based on query
  const filteredOptions = query === ''
    ? []
    : productOptions.filter(option =>
        option.product.type_name_ar.includes(query) ||
        (option.product.brand_name_ar || '').includes(query) ||
        (option.product.tags_list || []).some(tag => tag.includes(query))
      );

  const handleProductSelect = (option: ProductOption | null) => {
    if (!option) return;
    
    if (option.product.available_stock === 0) {
      alert(`المنتج ${option.product.type_name_ar} غير متوفر في المخزون`);
      return;
    }

    onAddProduct(option.product.id, 1); // Always add quantity of 1
    
    // Reset the combobox
    setSelectedProduct(null);
    setQuery('');
  };

  return (
    <div className="relative">
      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex flex-wrap gap-4">
          <span>⏎ Enter لإضافة المنتج</span>
          <span>↑↓ للتنقل</span>
          <span>Esc للمسح</span>
        </div>
      </div>

      <Combobox value={selectedProduct} onChange={handleProductSelect}>
        <div className="relative mt-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            
            <ComboboxInput
              className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              displayValue={() => query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث عن منتج..."
              autoComplete="off"
            />
          </div>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ComboboxOptions className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  لا توجد منتجات مطابقة للبحث
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <ComboboxOption
                    key={option.id}
                    className={({ focus }) =>
                      `px-4 py-3 cursor-pointer flex items-center space-x-3 space-x-reverse relative ${
                        focus ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-blue-50'
                      } ${option.product.available_stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`
                    }
                    value={option}
                    disabled={option.product.available_stock === 0}
                  >
                    <Package className={`w-5 h-5 ${option.product.is_low_stock ? 'text-orange-500' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {option.product.type_name_ar}
                        {option.product.brand_name_ar && (
                          <span className="text-gray-500"> - {option.product.brand_name_ar}</span>
                        )}
                        <span className="text-gray-500"> - رقم {option.product.id}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center space-x-4 space-x-reverse">
                        <span>السعر: ${option.product.selling_price}</span>
                        <span className={`${option.product.is_low_stock ? 'text-orange-600 font-medium' : ''}`}>
                          المتوفر: {option.product.available_stock}
                          {option.product.is_low_stock && ' ⚠️'}
                        </span>
                        {option.product.available_stock === 0 && (
                          <span className="text-red-600 font-medium">غير متوفر</span>
                        )}
                      </div>
                    </div>
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};