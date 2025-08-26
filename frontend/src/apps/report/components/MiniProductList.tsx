import React from "react";
import { RANK_COLORS, VALUE_COLORS } from "../../../constants/colors";

interface Product {
  type: string;
  brand: string;
  id: number;
  profit_usd?: number;
  profit_percentage?: number;
}

interface MiniProductListProps {
  data: Product[];
  valueFormatter: (product: Product) => string;
  showRank?: boolean;
  valueColor?: keyof typeof VALUE_COLORS;
}

export const ProductList: React.FC<MiniProductListProps> = ({
  data,
  valueFormatter,
  showRank = true,
  valueColor = "positive",
}) => (
  <div className="space-y-3">
    {data.slice(0, 3).map((product, index) => (
      <div key={index} className="flex justify-between items-center">
        <div className="flex items-center">
          {showRank ? (
            <span
              className={`inline-block w-6 h-6 rounded-full text-white text-xs flex items-center justify-center mr-3 ${
                RANK_COLORS[index] || ""
              }`}
            >
              {index + 1}
            </span>
          ) : (
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-3"></span>
          )}
          <span className="text-sm">
            {`${product.type} ${product.brand} رقم ${product.id}`}
          </span>
        </div>
        <span className={`font-semibold ${VALUE_COLORS[valueColor]}`}>
          {valueFormatter(product)}
        </span>
      </div>
    ))}
  </div>
);
