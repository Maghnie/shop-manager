import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import * as path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows access from other devices on the local network
    port: 5173, // Optional: specify a custom port
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8', 
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      // Keep coverage files when tests complete
      cleanOnRerun: false,
      // Include source files even if not tested
      all: true,
      exclude: [
        'node_modules/',
        'src/__tests__/setup.ts',
        'src/__tests__/handlers.ts',
        '**/*.d.ts',
        '**/*.config.ts',
        'dist/',
        'coverage/',
        'public/',
        'src/main.tsx'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules/', 'dist/']
  },
})
