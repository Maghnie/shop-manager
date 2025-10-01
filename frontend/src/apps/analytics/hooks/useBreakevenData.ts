import { useState, useEffect, useCallback } from 'react';
import { AnalyticsService } from '../services/analyticsService';
import { AnalyticsCacheService } from '../services/cacheService';
import type { BreakevenResponse, BreakevenRequest } from '../types/analytics';

interface UseBreakevenDataReturn {
  data: BreakevenResponse | null;
  loading: boolean;
  error: string | null;
  refetch: (params?: BreakevenRequest) => Promise<void>;
}

export const useBreakevenData = (
  initialParams?: BreakevenRequest
): UseBreakevenDataReturn => {
  const [data, setData] = useState<BreakevenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (params?: BreakevenRequest) => {
    setLoading(true);
    setError(null);

    try {
      const requestParams = { ...initialParams, ...params };
      const result = await AnalyticsService.getBreakevenData(requestParams);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  const refetch = useCallback(async (params?: BreakevenRequest) => {
    await fetchData(params);
  }, [fetchData]);

  useEffect(() => {
    if (initialParams) {
      fetchData(initialParams);
    }

    // Listen for cache invalidation events
    const handleCacheInvalidation = () => {
      if (initialParams) {
        fetchData(initialParams);
      }
    };

    window.addEventListener('analytics-cache-invalidated', handleCacheInvalidation);

    // Set up periodic refresh for real-time updates
    const refreshInterval = setInterval(() => {
      if (AnalyticsCacheService.shouldInvalidateCache() && initialParams) {
        fetchData(initialParams);
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => {
      window.removeEventListener('analytics-cache-invalidated', handleCacheInvalidation);
      clearInterval(refreshInterval);
    };
  }, []); // Only run on mount

  return { data, loading, error, refetch };
};
