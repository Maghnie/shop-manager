// __tests__/services/productService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { 
  fetchProducts, 
  fetchTypes, 
  fetchBrands, 
  fetchMaterials, 
  deleteProduct 
} from '@/services/productService';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  }
}));

const mockedAxios = axios as any;

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchProducts', () => {
    it('should call correct API endpoint', async () => {
      const mockResponse = { data: { results: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchProducts();

      expect(mockedAxios.get).toHaveBeenCalledWith('inventory/products/');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchProducts()).rejects.toThrow('Network error');
    });
  });

  describe('fetchTypes', () => {
    it('should call correct API endpoint', async () => {
      const mockResponse = { data: { results: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchTypes();

      expect(mockedAxios.get).toHaveBeenCalledWith('inventory/product-types/');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchBrands', () => {
    it('should call correct API endpoint', async () => {
      const mockResponse = { data: { results: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchBrands();

      expect(mockedAxios.get).toHaveBeenCalledWith('inventory/brands/');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchMaterials', () => {
    it('should call correct API endpoint', async () => {
      const mockResponse = { data: { results: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchMaterials();

      expect(mockedAxios.get).toHaveBeenCalledWith('inventory/materials/');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteProduct', () => {
    it('should call correct API endpoint with product ID', async () => {
      mockedAxios.delete.mockResolvedValue({ status: 204 });

      await deleteProduct(123);

      expect(mockedAxios.delete).toHaveBeenCalledWith('/inventory/products/123/');
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed');
      mockedAxios.delete.mockRejectedValue(error);

      await expect(deleteProduct(123)).rejects.toThrow('Deletion failed');
    });
  });
});