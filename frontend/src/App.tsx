// src/App.tsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Existing components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProductList from './pages/ProductOverview';
import ProductForm from './components/ProductForm';
import Reports from './components/Reports';
import Navbar from './components/Navbar';

// New sales components
import { SalesList, SaleForm, SaleDetail, QuickSale, SalesDashboard } from '@/apps/sales';

// New invoice components
import InvoicesList from './components/invoices/InvoicesList';
import InvoiceDetail from './components/invoices/InvoiceDetail';

// New inventory components
import InventoryList from './components/inventory/InventoryList';

// Analytics components
import { SalesAnalyticsDashboard } from './apps/analytics';

import './App.css';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1/';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // TODO: Set to false in production
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen w-full bg-gray-50 " dir="rtl">
        {isAuthenticated && <Navbar onLogout={handleLogout} />}

        <div className={isAuthenticated ? 'pt-16' : ''}>
          <main className="w-full">
            <Routes>
              {/* Authentication */}
              <Route
                path="/login"
                element={
                  !isAuthenticated ? (
                    <Login onLogin={handleLogin} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              {/* Main Dashboard */}
              <Route
                path="/"
                element={
                  isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
                }
              />

              {/* Products Routes */}
              <Route
                path="/products"
                element={
                  isAuthenticated ? <ProductList /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/products/new"
                element={
                  isAuthenticated ? <ProductForm /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/products/:id/edit"
                element={
                  isAuthenticated ? <ProductForm /> : <Navigate to="/login" />
                }
              />

              {/* Sales Routes */}
              <Route
                path="/sales"
                element={
                  isAuthenticated ? <SalesList /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/sales/dashboard"
                element={
                  isAuthenticated ? <SalesDashboard /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/sales/new"
                element={
                  isAuthenticated ? <SaleForm /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/sales/quick"
                element={
                  isAuthenticated ? <QuickSale /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/sales/:id"
                element={
                  isAuthenticated ? <SaleDetail /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/sales/:id/edit"
                element={
                  isAuthenticated ? <SaleForm /> : <Navigate to="/login" />
                }
              />

              {/* Invoice Routes */}
              <Route
                path="/invoices"
                element={
                  isAuthenticated ? <InvoicesList /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/invoices/:id"
                element={
                  isAuthenticated ? <InvoiceDetail /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/invoices/sale/:saleId"
                element={
                  isAuthenticated ? <InvoiceDetail /> : <Navigate to="/login" />
                }
              />

              {/* Inventory Routes */}
              <Route
                path="/inventory"
                element={
                  isAuthenticated ? <InventoryList /> : <Navigate to="/login" />
                }
              />

              {/* Reports */}
              <Route
                path="/reports"
                element={
                  isAuthenticated ? <Reports /> : <Navigate to="/login" />
                }
              />

              {/* Analytics */}
              <Route
                path="/analytics"
                element={
                  isAuthenticated ? <SalesAnalyticsDashboard /> : <Navigate to="/login" />
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;