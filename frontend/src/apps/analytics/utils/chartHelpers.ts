import type { TimeSeriesDataPoint, BreakevenProduct } from '../types/analytics';
import { AnalyticsService } from '../services/analyticsService';

/**
 * Utility functions for data validation
 */
export const isValidTimeSeriesData = (data: TimeSeriesDataPoint[] | null | undefined): boolean => {
  return !!(data && Array.isArray(data) && data.length > 0);
};

export const isValidBreakevenData = (data: BreakevenProduct[] | null | undefined): boolean => {
  return !!(data && Array.isArray(data) && data.length > 0);
};

export const getEmptyDataMessage = (chartType: 'timeseries' | 'breakeven'): string => {
  switch (chartType) {
    case 'timeseries':
      return 'لا توجد بيانات مبيعات في الفترة الزمنية المحددة';
    case 'breakeven':
      return 'لا توجد بيانات منتجات لتحليل نقطة التعادل';
    default:
      return 'لا توجد بيانات لعرضها';
  }
};

/**
 * Chart color schemes
 */
export const CHART_COLORS = {
  revenue: '#3B82F6',  // Blue
  costs: '#EF4444',    // Red
  profit: '#10B981',   // Green
  salesCount: '#8B5CF6', // Purple
  breakeven: '#F59E0B', // Amber
  performance: '#06B6D4', // Cyan
};

/**
 * Format chart data for time series
 */
export const formatTimeSeriesForChart = (
  data: TimeSeriesDataPoint[],
  config: {
    showRevenue?: boolean;
    showCosts?: boolean;
    showProfit?: boolean;
    showSalesCount?: boolean;
  }
) => {
  // Validate input data
  if (!isValidTimeSeriesData(data)) {
    return null;
  }

  const datasets = [];

  if (config.showRevenue) {
    datasets.push({
      label: 'الإيرادات',
      data: data.map(d => d.revenue),
      borderColor: CHART_COLORS.revenue,
      backgroundColor: `${CHART_COLORS.revenue}20`,
      tension: 0.4,
      fill: false,
      pointStyle: 'rect', // Box/rectangle symbol
      pointRadius: 6,
      pointHoverRadius: 8,
    });
  }

  if (config.showCosts) {
    datasets.push({
      label: 'التكاليف',
      data: data.map(d => d.costs),
      borderColor: CHART_COLORS.costs,
      backgroundColor: `${CHART_COLORS.costs}20`,
      tension: 0.4,
      fill: false,
      pointStyle: 'triangle', // Triangle symbol
      pointRadius: 6,
      pointHoverRadius: 8,
    });
  }

  if (config.showProfit) {
    datasets.push({
      label: 'الربح',
      data: data.map(d => d.profit),
      borderColor: CHART_COLORS.profit,
      backgroundColor: `${CHART_COLORS.profit}20`,
      tension: 0.4,
      fill: true,
      pointStyle: 'star', // Star symbol
      pointRadius: 7,
      pointHoverRadius: 9,
    });
  }

  if (config.showSalesCount) {
    datasets.push({
      label: 'عدد المبيعات',
      data: data.map(d => d.sales_count),
      borderColor: CHART_COLORS.salesCount,
      backgroundColor: `${CHART_COLORS.salesCount}20`,
      tension: 0.4,
      fill: false,
      yAxisID: 'y1', // Secondary y-axis for counts
      pointStyle: 'circle', // Circle symbol (default)
      pointRadius: 5,
      pointHoverRadius: 7,
    });
  }

  return {
    labels: data.map(d => new Date(d.period).toLocaleDateString('ar-LB')),
    datasets,
  };
};

/**
 * Chart options for time series
 */
export const getTimeSeriesChartOptions = (hasSecondaryAxis: boolean = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  resizeDelay: 100,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      rtl: true,
      textDirection: 'rtl',
      labels: {
        usePointStyle: true, // Use the actual point styles in legend
        pointStyleWidth: 15, // Make legend symbols larger
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      rtl: true,
      textDirection: 'rtl',
      usePointStyle: true, // Use actual point styles in tooltip
      callbacks: {
        title: (context: any) => {
          return context[0].label;
        },
        label: (context: any) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;

          if (context.dataset.label === 'عدد المبيعات') {
            return `${label}: ${value}`;
          } else {
            return `${label}: ${AnalyticsService.formatCurrency(value)}`;
          }
        },
        labelPointStyle: (context: any) => {
          // Return the dataset's point style for the tooltip
          return {
            pointStyle: context.dataset.pointStyle || 'circle',
            rotation: 0
          };
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'الفترة الزمنية'
      },
      ticks: {
        maxTicksLimit: 10
      }
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'المبلغ (بالدولار)'
      },
      ticks: {
        callback: function(value: any) {
          return AnalyticsService.formatCurrency(value);
        }
      }
    },
    ...(hasSecondaryAxis ? {
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'العدد'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          stepSize: 1
        }
      }
    } : {})
  }
});

/**
 * Format breakeven data for proper break-even analysis chart
 */
export const formatBreakevenForChart = (products: BreakevenProduct[], fixedCosts: number = 0) => {
  // Validate input data
  if (!isValidBreakevenData(products)) {
    return null;
  }

  // For a proper break-even chart, we need to show one product at a time
  // If multiple products, take the first one or aggregate them
  const product = products[0];

  if (!product) return null;

  // Generate quantity range for x-axis (0 to max of breakeven units * 2)
  const maxQuantity = Math.max(product.breakeven_units * 2, product.actual_performance.quantity_sold * 1.5, 100);
  const quantityRange: number[] = [];
  const step = Math.ceil(maxQuantity / 20); // 20 points on the chart

  for (let i = 0; i <= maxQuantity; i += step) {
    quantityRange.push(i);
  }

  // Calculate lines for each quantity point
  const revenueData = quantityRange.map(qty => qty * product.unit_price);
  const variableCostsData = quantityRange.map(qty => qty * product.unit_cost);
  const totalCostsData = quantityRange.map(qty => fixedCosts + (qty * product.unit_cost));
  const fixedCostsData = quantityRange.map(() => fixedCosts);

  // Find break-even point intersection
  const breakevenQuantity = product.breakeven_units;
  const breakevenRevenue = breakevenQuantity * product.unit_price;

  // Find closest indices for breakeven and actual performance points
  const breakevenIndex = quantityRange.reduce((closest, curr, i) =>
    Math.abs(curr - breakevenQuantity) < Math.abs(quantityRange[closest] - breakevenQuantity) ? i : closest, 0
  );

  const actualPerformanceIndex = quantityRange.reduce((closest, curr, i) =>
    Math.abs(curr - product.actual_performance.quantity_sold) < Math.abs(quantityRange[closest] - product.actual_performance.quantity_sold) ? i : closest, 0
  );

  return {
    labels: quantityRange,
    datasets: [
      {
        label: 'التكاليف الثابتة',
        data: fixedCostsData,
        borderColor: CHART_COLORS.costs,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointStyle: 'dash',
        fill: false,
      },
      {
        label: 'إجمالي التكاليف',
        data: totalCostsData,
        borderColor: '#EF4444',
        backgroundColor: `${CHART_COLORS.costs}20`,
        borderWidth: 3,
        pointRadius: 0,
        pointStyle: 'rect',
        fill: '+1', // Fill area between this line and fixed costs
      },
      {
        label: 'الإيرادات',
        data: revenueData,
        borderColor: CHART_COLORS.revenue,
        backgroundColor: `${CHART_COLORS.revenue}20`,
        borderWidth: 3,
        pointRadius: 0,
        pointStyle: 'rect',
        fill: false,
      },
      {
        label: 'منطقة الربح',
        data: revenueData,
        borderColor: 'transparent',
        backgroundColor: `${CHART_COLORS.profit}25`,
        borderWidth: 0,
        pointRadius: 0,
        pointStyle: 'rectRot',
        fill: {
          target: 1, // Fill between this line and the total costs line (dataset index 1)
          above: `${CHART_COLORS.profit}25`, // Green when revenue is above costs
          below: 'transparent' // Transparent when below
        },
      },
      {
        label: 'نقطة التعادل',
        data: quantityRange.map((qty, index) =>
          index === breakevenIndex ? breakevenRevenue : null
        ),
        borderColor: CHART_COLORS.breakeven,
        backgroundColor: CHART_COLORS.breakeven,
        borderWidth: 0,
        pointRadius: quantityRange.map((qty, index) =>
          index === breakevenIndex ? 10 : 0
        ),
        pointBorderWidth: 3,
        pointBorderColor: '#fff',
        pointStyle: 'triangle',
        showLine: false,
        fill: false,
      },
      {
        label: 'الأداء الفعلي',
        data: quantityRange.map((qty, index) =>
          index === actualPerformanceIndex ? product.actual_performance.revenue : null
        ),
        borderColor: CHART_COLORS.performance,
        backgroundColor: CHART_COLORS.performance,
        borderWidth: 0,
        pointRadius: quantityRange.map((qty, index) =>
          index === actualPerformanceIndex ? 8 : 0
        ),
        pointBorderWidth: 2,
        pointBorderColor: '#fff',
        pointStyle: 'star',
        showLine: false,
        fill: false,
      }
    ],
    breakevenPoint: {
      quantity: breakevenQuantity,
      revenue: breakevenRevenue,
      actualQuantity: product.actual_performance.quantity_sold,
      actualRevenue: product.actual_performance.revenue
    }
  };
};

/**
 * Chart options for breakeven analysis
 */
export const getBreakevenChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  resizeDelay: 100,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      rtl: true,
      textDirection: 'rtl',
      labels: {
        usePointStyle: true, // Use the actual point styles in legend
        pointStyleWidth: 15, // Make legend symbols larger
        padding: 25, // Increase horizontal spacing between legend items
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      rtl: true,
      textDirection: 'rtl',
      filter: (tooltipItem: any) => {
        // Only show tooltip for non-null values
        return tooltipItem.parsed.y !== null;
      },
      callbacks: {
        title: (context: any) => {
          return `الكمية: ${context[0].label} وحدة`;
        },
        label: (context: any) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;

          if (label === 'نقطة التعادل' || label === 'الأداء الفعلي') {
            return `${label}: ${AnalyticsService.formatCurrency(value)}`;
          } else {
            return `${label}: ${AnalyticsService.formatCurrency(value)}`;
          }
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'الكمية (عدد الوحدات)'
      },
      ticks: {
        stepSize: 1
      }
    },
    y: {
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'المبلغ (بالدولار)'
      },
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          return AnalyticsService.formatCurrency(value);
        }
      }
    }
  },
  elements: {
    line: {
      tension: 0.1
    }
  }
});