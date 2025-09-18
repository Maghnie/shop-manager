import React from "react";
import { Link } from "react-router-dom";
import { Info, Archive, RotateCcw } from "lucide-react";
import { type Product } from "@/types/product";

interface Props {
  product: Product;
  adminView: boolean;
  onArchive: (id: number) => void;
  onRestore?: (id: number) => void;
  showArchived?: boolean;
}

const ProductRow: React.FC<Props> = ({ 
  product, 
  adminView, 
  onArchive, 
  onRestore,
  showArchived = false 
}) => {
  const handleArchiveClick = () => {
    const productName = `${product.type_name_ar} - ${product.brand_name_ar || 'عام'}`;
    const action = showArchived ? "استعادة" : "أرشفة";
    const message = showArchived 
      ? `هل أنت متأكد من استعادة المنتج "${productName}"؟`
      : `هل أنت متأكد من أرشفة المنتج "${productName}"؟`;
      
    if (window.confirm(message)) {
      if (showArchived && onRestore) {
        onRestore(product.id);
      } else {
        onArchive(product.id);
      }
    }
  };

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `${num.toFixed(2)}`;
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="py-4 px-6 text-gray-900">{product.id}</td>
      <td className="py-4 px-6 text-gray-900 font-medium">{product.type_name_ar}</td>
      <td className="py-4 px-6 text-gray-700">{product.brand_name_ar || 'عام'}</td>
      <td className="py-4 px-6 text-gray-700">{product.size || '—'}</td>
      <td className="py-4 px-6 text-gray-700">{formatCurrency(product.cost_price)}</td>
      <td className="py-4 px-6 text-gray-900 font-semibold bg-yellow-50">{formatCurrency(product.selling_price)}</td>
      <td className="py-4 px-6 text-green-600 font-medium">{formatCurrency(product.profit)}</td>
      <td className="py-4 px-6 text-green-600 font-medium">{Number(product.profit_percentage).toFixed(1)}%</td>
      <td className="py-4 px-6">
        <div className="flex flex-wrap gap-1">
          {Array.isArray(product.tags_list) && product.tags_list.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
              {tag}
            </span>
          ))}
          {product.tags_list.length > 3 && (
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
  );
};

export default ProductRow;