// Covers search + dropdown changes.

import { render, screen, fireEvent } from "@testing-library/react";
import ProductFilters from "@/components/products/ProductFilters";
import type { Filters } from "@/types/product";

describe("ProductFilters", () => {
  const filters: Filters = { search: "", type: "", brand: "", material: "" };
  const setFilters = vi.fn();

  it("updates search filter", () => {
    render(<ProductFilters filters={filters} setFilters={setFilters} productTypes={[]} brands={[]} materials={[]} />);
    const input = screen.getByPlaceholderText(/ابحث في المنتجات/i);
    fireEvent.change(input, { target: { value: "phone" } });

    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ search: "phone" }));
  });

  it("updates type filter", () => {
    render(
      <ProductFilters
        filters={filters}
        setFilters={setFilters}
        productTypes={[{ id: 1, name_ar: "نوع" }]}
        brands={[]}
        materials={[]}
      />
    );

    fireEvent.change(screen.getByDisplayValue(""), { target: { value: "1" } });
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ type: "1" }));
  });
});
