export { SalesAnalyticsDashboard } from './pages/SalesAnalyticsDashboard';
export { TimeSeriesChart, SalesHeatmap, ResolutionSelector } from './components';
export { useSalesTimeSeries, useSalesReports, useSalesReportSummary, useSalesHeatmapData } from './hooks/useSalesTimeSeries';
export { AnalyticsService } from './services/analyticsService';
export type { 
  SalesReportData, 
  SalesReportTrend, 
  SalesReportSummary, 
  SalesReportFilters, 
  SalesReportTrendsFilters 
} from './services/analyticsService';