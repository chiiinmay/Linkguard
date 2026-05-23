import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1A1E26', color: '#E8EAED', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '14px' },
            success: { iconTheme: { primary: '#C6F135', secondary: '#0A0C10' } },
            error:   { iconTheme: { primary: '#FF5C5C', secondary: '#0A0C10' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
