// src/apps/dashboard/hooks/useReportData.ts
import { useQuery } from "@tanstack/react-query";
import { ReportData } from "@/types/report";

async function fetchReportData(reportId?: string): Promise<ReportData> {
  if (!reportId) {
    throw new Error("No report ID provided");
  }

  const res = await fetch(`/api/reports/${reportId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch report: ${res.status}`);
  }
  return res.json();
}

export function useReportData(reportId?: string) {
  return useQuery({
    queryKey: ["reportData", reportId],
    queryFn: () => fetchReportData(reportId),
    enabled: Boolean(reportId), // don't run if no ID
    staleTime: 1000 * 60 * 5, // 5 min caching
    retry: 2, // retry failed fetches up to 2 times
  });
}
