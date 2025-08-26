import { useState, useEffect } from 'react';
import { InventoryService } from '@/services/saleService';
import type { Inventory } from '@/types/product';

export const useInventory = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async (filters?: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);
      const data = await InventoryService.getInventory(filters);
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryItem = async (id: number, data: { quantity_in_stock: number; minimum_stock_level: number }) => {
    try {
      const updatedItem = await InventoryService.updateInventory(id, data);
      setInventory(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update inventory');
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    inventory,
    loading,
    error,
    refetch: fetchInventory,
    updateItem: updateInventoryItem,
    setInventory
  };
};

export const useLowStockAlert = () => {
  const [lowStockItems, setLowStockItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InventoryService.getLowStockItems();
      setLowStockItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch low stock items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockItems();
    
    // Set up polling for low stock alerts
    const interval = setInterval(fetchLowStockItems, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  return {
    lowStockItems,
    loading,
    error,
    refetch: fetchLowStockItems,
    count: lowStockItems.length
  };
};