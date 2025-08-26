import { useState, useEffect } from 'react';
import { InvoiceService } from '@/services/saleService';
import type { InvoiceListItem, Invoice } from '@/types/product';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async (filters?: Record<string, string>) => {
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
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  const fetchInvoice = async (invoiceId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await InvoiceService.getInvoice(invoiceId);
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceBySale = async (saleId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await InvoiceService.getInvoiceBySale(saleId);
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoice(id);
    }
  }, [id]);

  return {
    invoice,
    loading,
    error,
    refetch: () => id && fetchInvoice(id),
    fetchBySale: fetchInvoiceBySale,
    setInvoice
  };
};

