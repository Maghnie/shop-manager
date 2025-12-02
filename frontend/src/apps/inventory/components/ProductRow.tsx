import React from "react";
import { Link } from "react-router-dom";
import { Info, Archive, RotateCcw, AlertTriangle } from "lucide-react";
import { type Product } from "@/types/product";

interface Props {
  product: Product;
  adminView: boolean;
  onArchive: (id: number, forceArchive?: boolean) => void;
  onRestore?: (id: number) => void;
  showArchived?: boolean;
  isShowingWarning?: boolean;
  onHideWarning?: () => void;
}

const ProductRow: React.FC<Props> = ({ 
  product, 
  adminView, 
  onArchive, 
  onRestore,
  showArchived = false,
  isShowingWarning = false,
  onHideWarning
}) => {
  
  const handleArchiveClick = () => {
    if (showArchived && onRestore) {
      // Simple restore confirmation
      const productName = `${product.type_name_ar} - ${product.brand_name_ar || 'عام'}`;
      if (window.confirm(`هل أنت متأكد من استعادة المنتج "${productName}"؟`)) {
        onRestore(product.id);
      }
    } else {
      // Archive - this will trigger stock check in parent
      onArchive(product.id, false);
    }
  };

  const handleForceArchive = () => {
    // Force archive despite having stock
    onArchive(product.id, true);
  };

  const handleCancelArchive = () => {
    // Hide the warning
    if (onHideWarning) {
      onHideWarning();
    }
  };

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors duration-150">
        <td className="py-4 px-6 text-gray-900">{product.id}</td>
        <td className="py-4 px-6 text-gray-900 font-medium">{product.type_name_ar}</td>
        <td className="py-4 px-6 text-gray-700">{product.brand_name_ar || 'عام'}</td>
        <td className="py-4 px-6 text-gray-700">{product.size || '—'}</td>
        <td className="py-4 px-6 text-gray-700">{formatCurrency(product.cost_price)}</td>
        <td className="py-4 px-6 text-gray-900 font-semibold bg-yellow-50">{formatCurrency(product.selling_price)}</td>
        <td className="py-4 px-6 text-green-600 font-medium">{formatCurrency(product.profit)}</td>
        <td className="py-4 px-6 text-green-600 font-medium">{Number(product.profit_margin).toFixed(1)}%</td>
        <td className="py-4 px-6 text-green-600 font-medium">{Number(product.profit_percentage).toFixed(1)}%</td>
        <td className="py-4 px-6">
          <div className="flex flex-wrap gap-1">
            {Array.isArray(product.tags_list) && product.tags_list.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
            {product.tags_list && product.tags_list.length > 3 && (
              <div className="relative group inline-block">
                <span className="text-xs text-gray-500 cursor-pointer flex items-center gap-1">
                  +{product.tags_list.length - 3}
                  <Info size={12} className="text-gray-400" />
                </span>
                <div className="absolute z-10 hidden group-hover:flex flex-wrap bg-white shadow-lg rounded-lg p-2 text-xs text-gray-700 w-48 bottom-full mb-2">
                  {product.tags_list.map((tag, idx) => (
                    <span key={idx} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full m-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </td>
        {adminView && (
          <td className="py-4 px-6">
            <div className="flex justify-center space-x-2 space-x-reverse">
              {!showArchived && (
                <Link
                  to={`/products/${product.id}/edit`}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200"
                >
                  تحرير
                </Link>
              )}
              
              <button
                onClick={handleArchiveClick}
                className={`${
                  showArchived 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white px-3 py-1 rounded transition duration-200 flex items-center space-x-1 space-x-reverse`}
              >
                {showArchived ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>استعادة</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>أرشفة</span>
                  </>
                )}
              </button>
            </div>
          </td>
        )}
      </tr>

      {/* Stock Warning Row - Only show if this product is showing warning */}
      {isShowingWarning && (
        <tr>
          <td colSpan={adminView ? 10 : 9} className="py-0">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-2">
              <div className="flex items-start space-x-3 space-x-reverse">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-2">تحذير: المنتج لديه مخزون</h4>
                  <p className="text-yellow-700 mb-4">
                    هذا المنتج لديه <strong>{product.available_stock || 'غير معروف'}</strong> قطعة في المخزون. 
                    أرشفة المنتج ستجعله غير متاح للبيع الجديد لكن لن تؤثر على المخزون الحالي.
                  </p>
                  <div className="flex space-x-3 space-x-reverse">
                    <button
                      onClick={handleForceArchive}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition duration-200"
                    >
                      أرشف رغم وجود المخزون
                    </button>
                    <button
                      onClick={handleCancelArchive}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-200"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default ProductRow;