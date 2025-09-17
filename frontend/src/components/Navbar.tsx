// src/components/Navbar.tsx

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

type NavbarProps = {
  onLogout: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();
  const [salesDropdownOpen, setSalesDropdownOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'لوحة التحكم', icon: '🏠' },
    { path: '/products', label: 'المنتجات', icon: '🔖' },
    { path: '/inventory', label: 'المخزون', icon: '📦' },
  ];

  // Sales dropdown items
  const salesItems = [
    { path: '/sales/dashboard', label: 'لوحة المبيعات' },
    { path: '/sales', label: 'إدارة المبيعات' },
    { path: '/sales/quick', label: 'بيعة سريعة' },
    { path: '/invoices', label: 'الفواتير' }
  ];

  const isSalesActive = location.pathname.startsWith('/sales') || location.pathname.startsWith('/invoices');

  return (
    <nav className="bg-white shadow-lg fixed top-0 w-full z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-xl font-bold text-gray-800">نظام إدارة المخزون والمبيعات</h1>
            </div>
            
            <div className="flex gap-4">
              {/* Regular nav items */}
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2 ${
                    location.pathname === item.path
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Sales Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSalesDropdownOpen(!salesDropdownOpen)}
                  className={`px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2 ${
                    isSalesActive
                      ? 'bg-green-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>🛒</span>
                  <span>المبيعات</span>
                  {salesDropdownOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Dropdown Menu */}
                {salesDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {salesItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSalesDropdownOpen(false)}
                          className={`block px-4 py-2 text-sm transition duration-200 ${
                            location.pathname === item.path
                              ? 'bg-green-50 text-green-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Logout button */}
          <div>
            <button
              onClick={onLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {salesDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setSalesDropdownOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;