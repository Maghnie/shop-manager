export const RESOLUTION_OPTIONS = [
  { value: 'hourly', label: 'ساعي', icon: '🕐' },
  { value: 'daily', label: 'يومي', icon: '📅' },
  { value: 'weekly', label: 'أسبوعي', icon: '📊' },
  { value: 'monthly', label: 'شهري', icon: '🗓️' },
  { value: 'yearly', label: 'سنوي', icon: '🌌' },
] as const;

export const CHART_COLORS = {
  revenue: 'rgb(59, 130, 246)',
  revenueLight: 'rgba(59, 130, 246, 0.2)',
  profit: 'rgb(16, 185, 129)',
  profitLight: 'rgba(16, 185, 129, 0.2)',
  sales: 'rgb(245, 158, 11)',
  salesLight: 'rgba(245, 158, 11, 0.2)',
} as const;

export const HEATMAP_COLORS = {
  low: '#e0f2fe',
  medium: '#0ea5e9',
  high: '#0369a1',
  empty: '#f1f5f9',
} as const;

export const DAYS_OF_WEEK = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
] as const;

export const HOURS_24 = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);