// Covers end-to-end behavior: rendering products, toggling admin view, deleting products.

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import ProductOverview from "@/pages/ProductOverview";
import * as productService from "@/services/productService";

// Mock API
vi.mock("@/services/productService", () => ({
  fetchProducts: vi.fn(),
  fetchTypes: vi.fn(),
  fetchBrands: vi.fn(),
  fetchMaterials: vi.fn(),
  deleteProduct: vi.fn(),
}));

const mockProducts = [
  {
    id: 1,
    type_name_ar: "نوع 1",
    type_name_en: "Type 1",
    brand_name_ar: "ماركة 1",
    brand_name_en: "Brand 1",
    size: "L",
    cost_price: 10,
    selling_price: 20,
    profit: 10,
    profit_percentage: 50,
    tags_list: ["tag1", "tag2"],
  },
];

describe("ProductListPage", () => {
  beforeEach(() => {
    (productService.fetchProducts as any).mockResolvedValue({ data: { results: mockProducts } });
    (productService.fetchTypes as any).mockResolvedValue({ data: { results: [] } });
    (productService.fetchBrands as any).mockResolvedValue({ data: { results: [] } });
    (productService.fetchMaterials as any).mockResolvedValue({ data: { results: [] } });
  });

  it("renders products after loading", async () => {
    render(<ProductOverview />);
    expect(screen.getByText(/جاري تحميل المنتجات/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("نوع 1")).toBeInTheDocument();
      expect(screen.getByText("ماركة 1")).toBeInTheDocument();
    });
  });

  it("toggles admin view", async () => {
    render(<ProductOverview />);
    await screen.findByText("نوع 1");

    const toggle = screen.getByRole("button", { name: /عرض أدوات المسؤول/i });
    fireEvent.click(toggle);

    expect(await screen.findByText("تحرير")).toBeInTheDocument();
    expect(await screen.findByText("حذف")).toBeInTheDocument();
  });

  it("deletes a product", async () => {
    (productService.deleteProduct as any).mockResolvedValue({});
    render(<ProductOverview />);
    await screen.findByText("نوع 1");

    // Enable admin view
    fireEvent.click(screen.getByRole("button", { name: /عرض أدوات المسؤول/i }));

    fireEvent.click(await screen.findByText("حذف"));
    await waitFor(() => {
      expect(productService.deleteProduct).toHaveBeenCalledWith(1);
    });
  });
});
