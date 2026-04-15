/**
 * useFourMemeAuth.js
 *
 * Global authentication hook for the Four.meme platform.
 * Manages the full login lifecycle via MetaMask sign-in:
 *   - Auto-triggers on wallet connect / address change
 *   - Caches accessToken, userId, and user profile in state
 *   - Exposes `ensureAuth()` for lazy re-authentication on protected actions
 *   - Handles MetaMask rejection gracefully (non-fatal)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { getNonce, login, getUserInfo, getUserProfile } from '../lib/fourmeme'

export const AUTH_STATUS = {
  IDLE:      'idle',       // wallet not connected
  PENDING:   'pending',    // waiting for MetaMask signature
  LOADING:   'loading',    // calling Four.meme login API
  READY:     'ready',      // authenticated successfully
  ERROR:     'error',      // login failed
}

export function useFourMemeAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [status,      setStatus]      = useState(AUTH_STATUS.IDLE)
  const [accessToken, setAccessToken] = useState(null)
  const [userId,      setUserId]      = useState(null)
  const [userInfo,    setUserInfo]    = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [error,       setError]       = useState(null)

  // Tracks which address is currently authenticated to prevent redundant logins
  const loggedInAs = useRef(null)

  /**
   * Core login flow:
   *   1. Get nonce from Four.meme API
   *   2. Sign with MetaMask (user sees one popup, no gas)
   *   3. Exchange signature for access_token
   *   4. Fetch user info + profile
   */
  const doLogin = useCallback(async (addr) => {
    setStatus(AUTH_STATUS.PENDING)
    setError(null)
    try {
      const nonce = await getNonce(addr)

      setStatus(AUTH_STATUS.LOADING)
      const sig = await signMessageAsync({
        message: `You are sign in Meme ${nonce}`,
      })

      const token = await login(addr, sig)
      setAccessToken(token)

      const info = await getUserInfo(token)
      setUserId(info.userId)
      setUserInfo(info)

      const prof = await getUserProfile(token, info.userId)
      setProfile(prof)

      loggedInAs.current = addr.toLowerCase()
      setStatus(AUTH_STATUS.READY)

      return token
    } catch (e) {
      // MetaMask rejection is not a fatal error — just reset to idle
      const msg = e.message ?? ''
      if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('4001')) {
        setStatus(AUTH_STATUS.IDLE)
        setError('Login cancelled — you rejected the signature request.')
      } else {
        setStatus(AUTH_STATUS.ERROR)
        setError(e.message)
      }
      throw e
    }
  }, [signMessageAsync])

  // Auto-login when wallet connects or switches to a different address
  useEffect(() => {
    if (!isConnected || !address) {
      // Wallet disconnected — clear entire session
      setAccessToken(null)
      setUserId(null)
      setUserInfo(null)
      setProfile(null)
      setStatus(AUTH_STATUS.IDLE)
      setError(null)
      loggedInAs.current = null
      return
    }

    // Skip if already logged in as this address
    if (loggedInAs.current === address.toLowerCase() && status === AUTH_STATUS.READY) {
      return
    }

    doLogin(address).catch(() => {/* error handled inside doLogin */})
  }, [address, isConnected])

  /**
   * Returns a valid accessToken, re-authenticating if the session expired.
   * Call this before any protected action (token creation, image upload, etc.)
   */
  const ensureAuth = useCallback(async () => {
    if (status === AUTH_STATUS.READY && accessToken) {
      return accessToken
    }
    if (!address || !isConnected) {
      throw new Error('Wallet not connected')
    }
    return doLogin(address)
  }, [status, accessToken, address, isConnected, doLogin])

  /** Manual retry — useful after a failed login attempt. */
  const retry = useCallback(() => {
    if (address && isConnected) {
      doLogin(address).catch(() => {})
    }
  }, [address, isConnected, doLogin])

  const isReady = status === AUTH_STATUS.READY
  const isPending = status === AUTH_STATUS.PENDING || status === AUTH_STATUS.LOADING

  return {
    status,
    accessToken,
    userId,
    userInfo,
    profile,
    error,
    isReady,
    isPending,
    ensureAuth,
    retry,
  }
}
