import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
// import ProductList from './components/ProductList';
import ProductList from './pages/ProductOverview';
import ProductForm from './components/ProductForm';
import Reports from './components/Reports';
import Navbar from './components/Navbar';
import './App.css';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1/';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // TODO
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
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {isAuthenticated && <Navbar onLogout={handleLogout} />}

        <div className={isAuthenticated ? 'pt-16' : ''}>
          <main className="container mx-auto px-4 py-6">
          <Routes>
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
            <Route
              path="/"
              element={
                isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
              }
            />
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
            <Route
              path="/reports"
              element={
                isAuthenticated ? <Reports /> : <Navigate to="/login" />
              }
            />
          </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
