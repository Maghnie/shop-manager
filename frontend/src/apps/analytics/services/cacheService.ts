/**
 * Cache invalidation service for analytics data
 */
export class AnalyticsCacheService {
  private static lastSaleUpdate: Date | null = null;
  private static cacheValidityPeriod = 2 * 60 * 1000; // 2 minutes

  /**
   * Check if analytics cache should be invalidated
   */
  static shouldInvalidateCache(): boolean {
    if (!this.lastSaleUpdate) {
      return false;
    }

    const now = new Date();
    const timeSinceUpdate = now.getTime() - this.lastSaleUpdate.getTime();

    return timeSinceUpdate < this.cacheValidityPeriod;
  }

  /**
   * Mark that a sale was updated (invalidates cache)
   */
  static markSaleUpdate(): void {
    this.lastSaleUpdate = new Date();

    // Notify all analytics components to refresh
    window.dispatchEvent(new CustomEvent('analytics-cache-invalidated', {
      detail: { timestamp: this.lastSaleUpdate }
    }));
  }

  /**
   * Listen for sale updates from other parts of the app
   */
  static listenForSaleUpdates(): void {
    // Listen for sale creation/update events
    window.addEventListener('sale-created', () => {
      this.markSaleUpdate();
    });

    window.addEventListener('sale-updated', () => {
      this.markSaleUpdate();
    });

    window.addEventListener('sale-deleted', () => {
      this.markSaleUpdate();
    });
  }

  /**
   * Initialize cache service
   */
  static initialize(): void {
    this.listenForSaleUpdates();
  }
}

// Auto-initialize when module loads
AnalyticsCacheService.initialize();