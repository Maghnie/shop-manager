import { useState, useCallback } from 'react';
import { AnalyticsService } from '../services/analyticsService';
import type { ExportRequest } from '../types/analytics';
import toast from 'react-hot-toast';

interface UseAnalyticsExportReturn {
  exporting: boolean;
  error: string | null;
  exportData: (params: ExportRequest) => Promise<void>;
}

export const useAnalyticsExport = (): UseAnalyticsExportReturn => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async (params: ExportRequest) => {
    setExporting(true);
    setError(null);

    try {
      // Show loading toast
      const loadingToast = toast.loading('جاري تصدير البيانات...');

      // Export data
      const blob = await AnalyticsService.exportData(params);
      
      // Generate filename
      const filename = params.filename || AnalyticsService.generateFilename(
        params.export_type,
        params.format,
        params
      );

      // Download file
      await AnalyticsService.downloadFile(blob, filename);

      // Show success message
      toast.success('تم تصدير البيانات بنجاح', { id: loadingToast });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في تصدير البيانات';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, error, exportData };
};