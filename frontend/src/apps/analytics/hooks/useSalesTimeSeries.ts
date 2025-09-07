import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { AnalyticsService, type SalesReportTrend, type SalesReportFilters, type SalesReportTrendsFilters } from '../services/analyticsService';

export function useSalesTimeSeries(filters: SalesReportTrendsFilters) {
  return useQuery({
    queryKey: ['salesTimeSeries', filters.resolution, filters.start_date, filters.end_date],
    queryFn: () => AnalyticsService.getSalesReportTrends(filters),
    enabled: Boolean(filters.resolution && filters.start_date && filters.end_date),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

export function useSalesReports(filters: SalesReportFilters) {
  return useQuery({
    queryKey: ['salesReports', filters.resolution, filters.start_date, filters.end_date, filters.limit],
    queryFn: () => AnalyticsService.getSalesReports(filters),
    enabled: Boolean(filters.resolution && filters.start_date && filters.end_date),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

export function useSalesReportSummary(filters: SalesReportFilters) {
  return useQuery({
    queryKey: ['salesReportSummary', filters.resolution, filters.start_date, filters.end_date],
    queryFn: () => AnalyticsService.getSalesReportSummary(filters),
    enabled: Boolean(filters.resolution && filters.start_date && filters.end_date),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

export function useSalesHeatmapData(
  resolution: 'hourly' | 'daily' = 'hourly',
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: ['salesHeatmap', resolution, startDate, endDate],
    queryFn: () => AnalyticsService.getSalesHeatmapData(resolution, startDate, endDate),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
}