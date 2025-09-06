import { useQuery } from '@tanstack/react-query';
import { AnalyticsService, type SalesReportTrend, type SalesReportFilters, type SalesReportTrendsFilters } from '../services/analyticsService';

export function useSalesTimeSeries(filters: SalesReportTrendsFilters) {
  return useQuery({
    queryKey: ['salesTimeSeries', filters],
    queryFn: () => AnalyticsService.getSalesReportTrends(filters),
    enabled: Boolean(filters.resolution),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

export function useSalesReports(filters?: SalesReportFilters) {
  return useQuery({
    queryKey: ['salesReports', filters],
    queryFn: () => AnalyticsService.getSalesReports(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

export function useSalesReportSummary(filters: SalesReportFilters) {
  return useQuery({
    queryKey: ['salesReportSummary', filters],
    queryFn: () => AnalyticsService.getSalesReportSummary(filters),
    enabled: Boolean(filters.resolution),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

export function useSalesHeatmapData(resolution: 'hourly' | 'daily' = 'hourly') {
  return useQuery({
    queryKey: ['salesHeatmap', resolution],
    queryFn: () => AnalyticsService.getSalesHeatmapData(resolution),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
}