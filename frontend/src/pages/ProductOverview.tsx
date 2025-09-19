import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Pencil, PencilOff } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import ProductFilters from "@/components/products/ProductFilters";
import ProductTable from "@/components/products/ProductTable";
import { toggleProductArchive } from "@/services/productService";

const ProductOverview: React.FC = () => {
  const { products, filteredProducts, productTypes, brands, materials, loading, filters, setFilters, setProducts } = useProducts();
  const [adminView, setAdminView] = useState(false);
  const [showingStockWarning, setShowingStockWarning] = useState<number | null>(null);

  const handleArchive = async (productId: number, forceArchive: boolean = false) => {
    try {
      const response = await toggleProductArchive(productId, forceArchive);
      
      if (response.data.status === 'warning' && response.data.requires_confirmation) {
        // Show inline stock warning for this specific product
        setShowingStockWarning(productId);
        return;
      }
      
      if (response.data.status === 'success') {
        // Success - remove product from list and hide any warnings
        setProducts(prev => prev.filter(p => p.id !== productId));
        setShowingStockWarning(null);
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Archive error:', error);
      alert("حدث خطأ أثناء أرشفة المنتج");
      setShowingStockWarning(null);
    }
  };

  const handleHideWarning = () => {
    setShowingStockWarning(null);
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
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={() => setAdminView(!adminView)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >            
            {adminView ?  <PencilOff className="w-4 h-4" /> : <Pencil className="w-4 h-4" /> }
          </button>
          <Link
            to="/products/archived"
            className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <Archive className="w-4 h-4" />
            {/* <span>المنتجات المؤرشفة</span> */}
          </Link>
          <Link
            to="/products/new"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold"
          >
            إضافة منتج جديد +
          </Link>
        </div>
      </div>      

      <ProductFilters
        filters={filters}
        setFilters={setFilters}
        productTypes={productTypes}
        brands={brands}
        materials={materials}
      />

      <ProductTable 
        products={filteredProducts} 
        adminView={adminView} 
        onArchive={handleArchive}
        showingStockWarning={showingStockWarning}
        onHideWarning={handleHideWarning}
      />
    </div>
  );
};

export default ProductOverview;