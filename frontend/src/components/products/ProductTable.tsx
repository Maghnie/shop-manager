import React from "react";
import { type Product } from "@/types/product";
import ProductRow from "./ProductRow";

interface Props {
  products: Product[];
  adminView: boolean;
  onArchive: (id: number, forceArchive?: boolean) => void;
  onRestore?: (id: number) => void;
  showArchived?: boolean;
  showingStockWarning?: number | null;
  onHideWarning?: () => void;
}

const ProductTable: React.FC<Props> = ({ 
  products, 
  adminView, 
  onArchive, 
  onRestore,
  showArchived = false,
  showingStockWarning,
  onHideWarning
}) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">رقم تعريفي</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">النوع</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">العلامة التجارية</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">الحجم</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">سعر التكلفة</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700 bg-yellow-200">سعر البيع</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">الربح</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">نسبة الربح</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">الوسوم</th>
            {adminView && (
              <th className="text-center py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
            )}
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={adminView ? 10 : 9} className="text-center py-8 text-gray-500">
                {showArchived ? "لا توجد منتجات مؤرشفة" : "لا توجد منتجات مطابقة للبحث"}
              </td>
            </tr>
          ) : (
            products.map(product => (
              <ProductRow 
                key={product.id} 
                product={product} 
                adminView={adminView} 
                onArchive={onArchive}
                onRestore={onRestore}
                showArchived={showArchived}
                isShowingWarning={showingStockWarning === product.id}
                onHideWarning={onHideWarning}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default ProductTable;