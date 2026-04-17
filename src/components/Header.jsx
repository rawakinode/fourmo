/**
 * Header.jsx
 *
 * Top navigation bar with logo, wallet connection, and page tabs.
 * Shows a custom wallet pill with BNB balance and Four.meme auth status
 * indicator (colored dot) instead of the default RainbowKit button.
 */

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import { useLocation } from 'react-router-dom'
import { formatEther } from 'viem'
import { AUTH_STATUS } from '../hooks/useFourMemeAuth'
import { Sparkles, Rocket, Brain } from 'lucide-react'

export default function Header({ page, onNavigate, isConnected, auth }) {
  const { address } = useAccount()
  const { data: balance } = useBalance({ address })
  const { status: authStatus } = auth ?? {}
  const location = useLocation()

  const isActive = (p) => location.pathname === p

  return (
    <>
      <header className="header">
        <button className="logo-btn" onClick={() => onNavigate('landing')}>
          <img src="/logo_250.png" alt="fourmo logo" className="logo-img" />
          <span className="logo-text">fourmo</span>
        </button>
        <div className="header-right">
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              if (!mounted) return null
              if (!account || !chain) return (
                <button className="btn-connect" onClick={openConnectModal}>Connect Wallet</button>
              )
              if (chain.unsupported) return (
                <button className="btn-wrong-chain" onClick={openChainModal}>⚠ wrong network</button>
              )
              const bnb = balance ? parseFloat(formatEther(balance.value)).toFixed(3) : '—'
              // Auth status dot color mapping
              const authDot = authStatus === AUTH_STATUS.READY    ? 'auth-dot--ready'
                           : authStatus === AUTH_STATUS.PENDING  ? 'auth-dot--pending'
                           : authStatus === AUTH_STATUS.LOADING  ? 'auth-dot--loading'
                           : authStatus === AUTH_STATUS.ERROR    ? 'auth-dot--error' : ''
              return (
                <div className="wallet-pill" onClick={openAccountModal}>
                  <span className={`auth-dot ${authDot}`} title={
                    authStatus === AUTH_STATUS.READY ? 'Connected to Four.meme'
                    : authStatus === AUTH_STATUS.PENDING ? 'Waiting for signature…'
                    : authStatus === AUTH_STATUS.ERROR   ? 'Four.meme login failed'
                    : 'Not logged in'
                  } />
                  <span className="wallet-pill-bal">{bnb} BNB</span>
                  <span className="wallet-pill-sep" />
                  <span className="wallet-pill-addr">{account.address.slice(0,6)}…{account.address.slice(-4)}</span>
                </div>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </header>

      {/* Page navigation tabs */}
      <nav className="nav">
        <button className={`nav-item ${isActive('/create') ? 'nav-item--active' : ''}`}
          onClick={() => onNavigate('create')} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <Sparkles size={18} /><span className="nav-item-text">AI Meme Creator</span>
        </button>
        <button className={`nav-item ${isActive('/analysis') ? 'nav-item--active' : ''}`}
          onClick={() => onNavigate('analysis')} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <Brain size={18} /><span className="nav-item-text">AI Token Analysis</span>
        </button>
        <button className={`nav-item ${isActive('/my-tokens') ? 'nav-item--active' : ''}`}
          onClick={() => onNavigate('my-tokens')} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <Rocket size={18} /><span className="nav-item-text">My Tokens</span>
        </button>
      </nav>
    </>
  )
}
