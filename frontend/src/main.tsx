import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/600.css'
import '@fontsource/cairo/700.css'
import './index.css'
import App from './App.tsx'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
})

createRoot(document.getElementById('root')!).render(  
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App /> 
    </QueryClientProvider>
  </StrictMode>,
)
