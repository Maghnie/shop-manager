import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProductTable from "../components/ProductTable";
import { fetchArchivedProducts, toggleProductArchive } from "../services/productService";
import { type Product } from "../types/product";
import toast from 'react-hot-toast';


const ArchivedProducts: React.FC = () => {
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchivedProductsData();
  }, []);

  const fetchArchivedProductsData = async () => {
    try {
      const response = await fetchArchivedProducts();
      setArchivedProducts(response.data.results);
    } catch (error) {
      console.error('Error fetching archived products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (productId: number) => {
    try {
      const response = await toggleProductArchive(productId);
      if (response.data.status === 'success') {
        // Remove restored product from archived list
        setArchivedProducts(prev => prev.filter(p => p.id !== productId));
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء استعادة المنتج");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل المنتجات المؤرشفة...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">المنتجات المؤرشفة</h1>
          <p className="text-gray-600">
            إجمالي المنتجات المؤرشفة: {archivedProducts.length}
          </p>
        </div>
        <Link
          to="/products"
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200 flex items-center space-x-2 space-x-reverse"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>العودة للمنتجات</span>
        </Link>
      </div>

      <ProductTable 
        products={archivedProducts} 
        adminView={true} 
        onArchive={() => {}} // Not used for archived view
        onRestore={handleRestore}
        showArchived={true}
      />
    </div>
  );
};

export default ArchivedProducts;