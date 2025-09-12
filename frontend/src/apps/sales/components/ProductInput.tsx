import React, { useState, useRef, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
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
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<ProductOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredOptions([]);
      setIsDropdownOpen(false);
      return;
    }

    const searchTerm = inputValue.trim();
    const productOptions: ProductOption[] = products.map(product => ({
      id: product.id,
      label: `${product.type_name_ar} ${product.brand_name_ar} (المتوفر: ${product.available_stock})`,
      product
    }));
    console.log(searchTerm)
    console.log(productOptions.at(0)?.product)
    const filtered = productOptions.filter(option =>
      option.product.type_name_ar.includes(searchTerm) ||
      (option.product.brand_name_ar || '').includes(searchTerm) ||
      (option.product.tags_list || []).some(tag => tag.includes(searchTerm))
    );

    setFilteredOptions(filtered);
    setIsDropdownOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [inputValue, products]);

  // Parse quantity from input (e.g., "كيس بلاستيك 3" -> quantity: 3)
  const parseQuantityFromInput = (input: string): { searchTerm: string; quantity: number } => {
    const quantityMatch = input.match(/\s+(\d+)$/);
    if (quantityMatch) {
      const quantity = parseInt(quantityMatch[1]);
      const searchTerm = input.replace(/\s+\d+$/, '').trim();
      return { searchTerm, quantity };
    }
    return { searchTerm: input, quantity: 1 };
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          handleSelectProduct(filteredOptions[selectedIndex]);
        } else if (filteredOptions.length === 1) {
          // Auto-select if only one option
          handleSelectProduct(filteredOptions[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setInputValue('');
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectProduct = (option: ProductOption) => {
    const { quantity } = parseQuantityFromInput(inputValue);
    
    if (option.product.available_stock === 0) {
      alert(`المنتج ${option.product.type_name_ar} غير متوفر في المخزون`);
      return;
    }

    if (quantity > option.product.available_stock) {
      alert(`الكمية المطلوبة (${quantity}) تتجاوز المخزون المتاح (${option.product.available_stock})`);
      return;
    }

    onAddProduct(option.product.id, quantity);
    setInputValue('');
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    
    // Keep focus on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleClickOption = (option: ProductOption) => {
    handleSelectProduct(option);
  };

  // Clear input on Esc key
  useHotkeys('esc', () => {
    setInputValue('');
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
  }, []);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative">
      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex flex-wrap gap-4">
          <span>⏎ Enter لإضافة المنتج</span>
          <span>↑↓ للتنقل</span>
          <span>Esc للمسح</span>
          <span>Ctrl+Z للتراجع</span>
          <span>+ / - لتعديل الكمية الأخيرة</span>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ابحث عن منتج... (مثال: كيس بلاستيك 5 لإضافة 5 قطع)"
          className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {isDropdownOpen && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.id}
              onClick={() => handleClickOption(option)}
              className={`px-4 py-3 cursor-pointer flex items-center space-x-3 space-x-reverse hover:bg-blue-50 ${
                index === selectedIndex ? 'bg-blue-100 border-l-4 border-blue-500' : ''
              } ${option.product.available_stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Package className={`w-5 h-5 ${option.product.is_low_stock ? 'text-orange-500' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {option.product.type_name_ar}
                  {option.product.brand_name_ar && (
                    <span className="text-gray-500"> - {option.product.brand_name_ar}</span>
                  )}
                  <span className="text-gray-500"> - {`رقم ${option.product.id}`} </span>
                  
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
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
};