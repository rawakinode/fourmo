/**
 * main.jsx
 *
 * Application entry point. Wraps the app with all required providers:
 *   - WagmiProvider   — wallet/chain connection (BSC)
 *   - QueryClient     — React Query for async state
 *   - RainbowKit      — wallet connect modal with dark theme
 */

import ReactDOM from 'react-dom/client'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi.config'
import App from './App'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: '#00ff88',
          accentColorForeground: '#050a06',
          borderRadius: 'medium',
          fontStack: 'system',
        })}
        coolMode
      >
        <App />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
)
