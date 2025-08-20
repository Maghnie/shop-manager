// Checks tag display and tooltip.

import { render, screen } from "@testing-library/react";
import ProductTags from "@/components/products/ProductTags";

describe("ProductTags", () => {
  it("renders up to 3 tags", () => {
    render(<ProductTags tags={["one", "two", "three"]} />);
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
    expect(screen.getByText("three")).toBeInTheDocument();
  });

  it("renders +N when more than 3 tags", () => {
    render(<ProductTags tags={["one", "two", "three", "four"]} />);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("renders fallback for no tags", () => {
    render(<ProductTags tags={[]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
