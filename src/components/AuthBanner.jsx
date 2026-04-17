/**
 * AuthBanner.jsx
 *
 * Contextual banner shown during the Four.meme login flow.
 * Guides users through MetaMask signing with appropriate messaging
 * for each auth state. Hidden when idle or fully authenticated.
 */

import { AUTH_STATUS } from '../hooks/useFourMemeAuth'

export default function AuthBanner({ auth }) {
  const { status, error, retry, userInfo } = auth

  // Only show during active login states
  if (status === AUTH_STATUS.IDLE || status === AUTH_STATUS.READY) return null

  if (status === AUTH_STATUS.PENDING) {
    return (
      <div className="auth-banner auth-banner--pending">
        <span className="auth-banner-icon">🔑</span>
        <span>
          <strong>Check Wallet</strong> — sign the login message to connect to Four.meme
          <span className="auth-banner-sub"> (one-time per session, no gas fee)</span>
        </span>
        <span className="auth-banner-pulse" />
      </div>
    )
  }

  if (status === AUTH_STATUS.LOADING) {
    return (
      <div className="auth-banner auth-banner--loading">
        <span className="spin-fast">⚡</span>
        <span>Connecting to Four.meme…</span>
      </div>
    )
  }

  if (status === AUTH_STATUS.ERROR) {
    return (
      <div className="auth-banner auth-banner--error">
        <span>😵</span>
        <span>
          <strong>Login failed:</strong> {error}
        </span>
        <button className="auth-banner-retry" onClick={retry}>
          retry →
        </button>
      </div>
    )
  }

  return null
}
