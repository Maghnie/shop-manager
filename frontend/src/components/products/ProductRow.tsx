import React from "react";
import { Link } from "react-router-dom";
import { type Product } from "@/types/product";
import { deleteProduct } from "@/services/productService";
import ProductTags from "./ProductTags";

interface Props {
  product: Product;
  adminView: boolean;
  onDelete: (id: number) => void;
}

const formatCurrency = (amount: unknown) => {
  const num = Number(amount);
  return isNaN(num) ? "—" : `$${num.toFixed(2)}`;
};

const ProductRow: React.FC<Props> = ({ product, adminView, onDelete }) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-4 px-6 font-medium">{product.id}</td>
    <td className="py-4 px-6 font-medium">{product.type_name_ar}</td>
    <td className="py-4 px-6">{product.brand_name_ar || "غير محدد"}</td>
    <td className="py-4 px-6">{product.size || "غير محدد"}</td>
    <td className="py-4 px-6">{formatCurrency(product.cost_price)}</td>
    <td className="py-4 px-6 bg-yellow-100">{formatCurrency(product.selling_price)}</td>
    <td className="py-4 px-6 text-green-600 font-semibold">{formatCurrency(product.profit)}</td>
    <td className="py-4 px-6 text-green-600 font-semibold">{product.profit_percentage.toFixed(1)}%</td>
    <td className="py-4 px-6"><ProductTags tags={product.tags_list} /></td>
    {adminView && (
      <td className="py-4 px-6">
        <div className="flex justify-center space-x-2 space-x-reverse">
          <Link
            to={`/products/${product.id}/edit`}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200"
          >
            تحرير
          </Link>
          <button
            onClick={() => onDelete(product.id)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-200"
          >
            حذف
          </button>
        </div>
      </td>
    )}
  </tr>
);

export default ProductRow;
