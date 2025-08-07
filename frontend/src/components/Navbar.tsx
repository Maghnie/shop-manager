import React from 'react';
import { Link, useLocation } from 'react-router-dom';

type NavbarProps = {
  onLogout: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'لوحة التحكم', icon: '🏠' },
    { path: '/products', label: 'المنتجات', icon: '📦' },
    { path: '/reports', label: 'التقارير', icon: '📊' }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
        <nav className="bg-white shadow-lg fixed top-0 w-full z-50">      
      
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8 space-x-reverse">
            <div className="prose prose-lg">
                <h1 className="text-xl font-bold text-gray-800">نظام إدارة المخزون</h1>
            </div>
            
            
            <div className="flex space-x-4 space-x-reverse">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition duration-200 flex items-center space-x-2 space-x-reverse ${
                    location.pathname === item.path
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <nav className="flex gap-4 items-center px-4 py-2 bg-white shadow sticky top-0 z-10">    
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
          >
            تسجيل الخروج
          </button>
          </nav>
        </div>
      
    </nav>
    </div>
  );
};

export default Navbar;