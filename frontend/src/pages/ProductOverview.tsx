import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import ProductFilters from "@/components/products/ProductFilters";
import ProductTable from "@/components/products/ProductTable";
import { deleteProduct } from "@/services/productService";

const ProductOverview: React.FC = () => {
  const { products, filteredProducts, productTypes, brands, materials, loading, filters, setFilters, setProducts } = useProducts();
  const [adminView, setAdminView] = useState(false);

  const handleDelete = async (productId: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await deleteProduct(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
      } catch {
        alert("حدث خطأ أثناء حذف المنتج");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل المنتجات...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">إدارة المنتجات</h1>
          <p className="text-gray-600">
            إجمالي المنتجات: {filteredProducts.length} من {products.length}
          </p>
        </div>
        <Link
          to="/products/new"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold"
        >
          إضافة منتج جديد +
        </Link>
      </div>

      <button
        onClick={() => setAdminView(!adminView)}
        className="mb-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
      >
        {adminView ? "إخفاء أدوات المسؤول" : "عرض أدوات المسؤول"}
      </button>

      <ProductFilters
        filters={filters}
        setFilters={setFilters}
        productTypes={productTypes}
        brands={brands}
        materials={materials}
      />

      <ProductTable products={filteredProducts} adminView={adminView} onDelete={handleDelete} />
    </div>
  );
};

export default ProductOverview;
