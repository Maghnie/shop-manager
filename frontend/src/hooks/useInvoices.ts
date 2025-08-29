import { useState, useEffect, useCallback } from 'react';
import { InvoiceService } from '@/services/saleService';
import type { InvoiceListItem, Invoice } from '@/types/product';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (filters?: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);
      const data = await InvoiceService.getInvoices(filters);
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices,
    setInvoices
  };
};

export const useInvoice = (id?: number) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchInvoice = useCallback(async (invoiceId: number) => {
    // Prevent duplicate requests
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await InvoiceService.getInvoice(invoiceId);
      setInvoice(data);
      setHasFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const fetchInvoiceBySale = useCallback(async (saleId: number) => {
    // Prevent duplicate requests
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await InvoiceService.getInvoiceBySale(saleId);
      setInvoice(data);
      setHasFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (id && !hasFetched && !loading) {
      fetchInvoice(id);
    }
  }, [id, fetchInvoice, hasFetched, loading]);

  // Reset hasFetched when id changes
  useEffect(() => {
    if (id) {
      setHasFetched(false);
      setInvoice(null);
    }
  }, [id]);

  return {
    invoice,
    loading,
    error,
    refetch: useCallback(() => {
      if (id) {
        setHasFetched(false);
        fetchInvoice(id);
      }
    }, [id, fetchInvoice]),
    fetchBySale: fetchInvoiceBySale,
    setInvoice
  };
};