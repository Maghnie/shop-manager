import { test, expect } from "@playwright/test";

test.describe("Product List Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
  });

  test("loads and shows products", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "إدارة المنتجات" })).toBeVisible();
    await expect(page.getByText("إجمالي المنتجات")).toBeVisible();
  });

  test("filters by search input", async ({ page }) => {
    const search = page.getByPlaceholder("ابحث في المنتجات...");
    await search.fill("ماركة");
    await search.press("Enter");

    // After filtering, table should update
    await expect(page.getByRole("cell", { name: /ماركة/i })).toBeVisible();
  });

  test("toggles admin view and shows actions", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /عرض أدوات المسؤول/i });
    await toggle.click();

    await expect(page.getByRole("link", { name: "تحرير" })).toBeVisible();
    await expect(page.getByRole("button", { name: "حذف" })).toBeVisible();
  });

  test("deletes a product when admin view enabled", async ({ page }) => {
    await page.getByRole("button", { name: /عرض أدوات المسؤول/i }).click();

    const deleteBtn = page.getByRole("button", { name: "حذف" }).first();

    // Intercept network request for deletion
    await page.route("**/inventory/products/*", route => route.fulfill({ status: 200 }));

    await deleteBtn.click();

    // Confirm modal
    await page.on("dialog", dialog => dialog.accept());

    // Expect the row to disappear
    await expect(deleteBtn).not.toBeVisible();
  });
});
