// Checks rendering of rows + empty state

import { render, screen } from "@testing-library/react";
import ProductTable from "@/components/products/ProductTable";

const mockProduct = {
  id: 1,
  type_name_ar: "نوع",
  type_name_en: "Type",
  brand_name_ar: "ماركة",
  brand_name_en: "Brand",
  size: "M",
  cost_price: 10,
  selling_price: 20,
  profit: 10,
  profit_percentage: 50,
  tags_list: ["tag1"],
};

describe("ProductTable", () => {
  it("renders product row", () => {
    render(<ProductTable products={[mockProduct]} adminView={false} onDelete={() => {}} />);
    expect(screen.getByText("نوع")).toBeInTheDocument();
    expect(screen.getByText("ماركة")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<ProductTable products={[]} adminView={false} onDelete={() => {}} />);
    expect(screen.getByText(/لا توجد منتجات مطابقة للبحث/i)).toBeInTheDocument();
  });
});
