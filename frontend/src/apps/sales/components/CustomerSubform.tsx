import React from 'react';
import { User, ChevronDown, ChevronUp } from 'lucide-react';

interface CustomerData {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
}

interface CustomerSubFormProps {
  customerData: CustomerData;
  onUpdate: (field: keyof CustomerData, value: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export const CustomerSubform: React.FC<CustomerSubFormProps> = ({
  customerData,
  onUpdate,
  isVisible,
  onToggle
}) => {
  const hasCustomerData = customerData.customer_name || customerData.customer_phone;

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          <User className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">معلومات العميل (اختياري)</span>
          {hasCustomerData && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              تم الإدخال
            </span>
          )}
        </div>
        {isVisible ? 
          <ChevronUp className="w-5 h-5 text-gray-500" /> : 
          <ChevronDown className="w-5 h-5 text-gray-500" />
        }
      </button>
      
      {isVisible && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم العميل
              </label>
              <input
                type="text"
                value={customerData.customer_name}
                onChange={(e) => onUpdate('customer_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اختياري - للعملاء المباشرين"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={customerData.customer_phone}
                onChange={(e) => onUpdate('customer_phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اختياري"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <textarea
                value={customerData.customer_address}
                onChange={(e) => onUpdate('customer_address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="اختياري"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};