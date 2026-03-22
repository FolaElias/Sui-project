import { Buffer } from 'buffer'
window.Buffer = Buffer

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { WalletProvider } from './context/WalletContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(18,18,26,0.95)',
                color: '#E2E8F0',
                border: '1px solid rgba(153,69,255,0.3)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                boxShadow: '0 0 30px rgba(153,69,255,0.15)',
              },
              success: { iconTheme: { primary: '#14F195', secondary: '#0A0A0F' } },
              error:   { iconTheme: { primary: '#FF2EF7', secondary: '#0A0A0F' } },
            }}
          />
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
)
