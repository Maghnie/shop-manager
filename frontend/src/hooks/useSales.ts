// src/hooks/useSales.ts

import { useState, useEffect } from 'react';
import { SalesService } from '@/services/saleService';
import type { SaleListItem, Sale, SalesFilters, AvailableProduct, SalesStats } from '@/types/product';

export const useSales = () => {
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async (filters?: SalesFilters) => {
    try {
      setLoading(true);
      setError(null);
      const filterParams = filters ? Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      ) : undefined;
      
      const data = await SalesService.getSales(filterParams);
      setSales(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return {
    sales,
    loading,
    error,
    refetch: fetchSales,
    setSales
  };
};

export const useSale = (id?: number) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSale = async (saleId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await SalesService.getSale(saleId);
      setSale(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sale');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSale(id);
    }
  }, [id]);

  return {
    sale,
    loading,
    error,
    refetch: () => id && fetchSale(id),
    setSale
  };
};

export const useAvailableProducts = () => {
  const [products, setProducts] = useState<AvailableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SalesService.getAvailableProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts
  };
};

export const useSalesStats = () => {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SalesService.getSalesStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};