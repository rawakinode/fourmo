/**
 * wagmi.config.js
 *
 * Wagmi + RainbowKit configuration.
 * Targets BSC Mainnet only, using 1RPC as the default RPC endpoint
 * for reliability. WalletConnect project ID is loaded from env.
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bsc } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'Fourmo',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'fourmo-dev',
  chains: [bsc],
  transports: {
    [bsc.id]: http('https://1rpc.io/bnb'),
  },
  ssr: false,
})
