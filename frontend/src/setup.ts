// __tests__/setup.ts
import { beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom'; // This auto-extends expect in newer versions

// Setup
beforeAll(() => {
  // Mock IntersectionObserver
  Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    value: class IntersectionObserver {
      constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
      disconnect = vi.fn()
      observe = vi.fn()
      unobserve = vi.fn()
      readonly root = null
      readonly rootMargin = '0px'
      readonly thresholds = [0]
    }
  });

  // Mock ResizeObserver
  Object.defineProperty(global, 'ResizeObserver', {
    writable: true,
    value: class ResizeObserver {
      constructor(_callback: ResizeObserverCallback) {}
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});