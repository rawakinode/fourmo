/**
 * MyTokensPage.jsx
 *
 * Dashboard showing all tokens created by the authenticated user.
 * Features:
 *   - Grid and table view modes with toggle
 *   - Search/filter by name, symbol, status, lore
 *   - Pagination (12 per page in grid, 10 in table)
 *   - Hover actions: view on Four.meme, analyze with AI
 *   - Auto-fetches on auth ready, shows skeleton while loading
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { LayoutGrid, List, Search, Rocket } from 'lucide-react'
import { AUTH_STATUS } from '../hooks/useFourMemeAuth'

import { getMyTokens, resolveImg } from '../lib/fourmeme'
import useScrollReveal from '../hooks/useScrollReveal'


/** Grid card for a single token with hover overlay actions. */
function TokenCard({ token, onAnalyze }) {
  const name      = token.tokenName  ?? token.name      ?? '???'
  const shortName = token.shortName  ?? '???'
  const img       = resolveImg(token.image ?? token.img ?? token.imgUrl ?? '')
  const addr      = token.tokenAddress ?? ''
  const progress  = token.progress   != null ? Number(token.progress) : null
  const cap       = token.marketCap  ?? token.cap
  const capNum    = cap != null ? Number(cap) : null
  const increase  = token.dayIncrease ?? token.day1Increase
  const incNum    = increase != null ? Number(increase) : null
  const status    = token.status     ?? ''
  const pct       = progress != null ? Math.min(100, progress * 100) : null

  return (
    <div className="token-card token-card--hoverable">
      <div className="token-card-img-wrap">
        {img
          ? <img src={img} alt={name} className="token-card-img"
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex' }} />
          : null
        }
        <div className="token-card-img-ph" style={{ display: img ? 'none' : 'flex' }}>
          {shortName?.[0] ?? '?'}
        </div>
        <div className="token-card-badges">
          <span className={`token-card-status-pill token-card-status--${status.toLowerCase()}`}>
            {status === 'PUBLISH' ? '● live' : status === 'INIT' ? '◌ init' : status.toLowerCase()}
          </span>
        </div>
        {status === 'INIT' && (
          <div className="token-card-init-overlay">initializing…</div>
        )}
      </div>
      <div className="token-card-body">
        <div className="token-card-top">
          <span className="token-card-name" title={name}>{name}</span>
          <span className="token-card-symbol">${shortName}</span>
        </div>
        {pct != null && (
          <div className="token-card-progress-wrap">
            <div className="token-card-progress-track">
              <div className="token-card-progress-fill" style={{ width: `${pct.toFixed(1)}%` }} />
            </div>
            <span className="token-card-progress-pct">{pct.toFixed(0)}%</span>
          </div>
        )}
        <div className="token-card-stats">
          {capNum != null && (
            <span className="token-card-stat">
              <span className="token-card-stat-label">cap</span>
              <span className="token-card-stat-val">{capNum.toFixed(2)} BNB</span>
            </span>
          )}
          {incNum != null && (
            <span className={`token-card-stat-change ${incNum >= 0 ? 'pos' : 'neg'}`}>
              {incNum >= 0 ? '+' : ''}{(incNum * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      {/* Hover overlay with action buttons */}
      <div className="token-card-hover-overlay">
        <a
          href={`https://four.meme/token/${addr}`}
          target="_blank" rel="noopener noreferrer"
          className="token-card-action-btn token-card-action-btn--view"
          onClick={e => e.stopPropagation()}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          See on Four.meme
        </a>
        <button
          className="token-card-action-btn token-card-action-btn--analyze"
          onClick={e => { e.stopPropagation(); onAnalyze && onAnalyze(addr) }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
          Analyze with AI
        </button>
      </div>
    </div>
  )
}

/** Card component for public/explore token listings. */
function ExploreCard({ token }) {
  const name      = token.name      ?? '???'
  const shortName = token.shortName ?? '???'
  const img       = resolveImg(token.img ?? token.imgUrl ?? token.logo ?? '')
  const tag       = token.tag       ?? token.label ?? 'Meme'
  const addr      = token.tokenAddress ?? token.address ?? ''
  const progress  = token.progress  != null ? Number(token.progress) : null
  const cap       = token.cap       != null ? Number(token.cap) : null
  const increase  = token.day1Increase != null ? Number(token.day1Increase) : null
  const isAI      = token.aiCreator === true
  const status    = token.status    ?? ''
  const pct       = progress != null ? Math.min(100, progress * 100) : null

  return (
    <a
      href={`https://four.meme/token/${addr}`}
      target="_blank" rel="noopener noreferrer"
      className="token-card"
    >
      <div className="token-card-img-wrap">
        {img
          ? <img src={img} alt={name} className="token-card-img"
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex' }} />
          : null
        }
        <div className="token-card-img-ph" style={{ display: img ? 'none' : 'flex' }}>
          {shortName?.[0] ?? '?'}
        </div>
        <div className="token-card-badges">
          <span className="token-card-tag-pill">{tag}</span>
          {isAI && <span className="token-card-ai-pill">AI</span>}
        </div>
        {status === 'INIT' && (
          <div className="token-card-init-overlay">initializing…</div>
        )}
      </div>
      <div className="token-card-body">
        <div className="token-card-top">
          <span className="token-card-name" title={name}>{name}</span>
          <span className="token-card-symbol">${shortName}</span>
        </div>
        {pct != null && (
          <div className="token-card-progress-wrap">
            <div className="token-card-progress-track">
              <div className="token-card-progress-fill" style={{ width: `${pct.toFixed(1)}%` }} />
            </div>
            <span className="token-card-progress-pct">{pct.toFixed(0)}%</span>
          </div>
        )}
        <div className="token-card-stats">
          {cap != null && (
            <span className="token-card-stat">
              <span className="token-card-stat-label">cap</span>
              <span className="token-card-stat-val">{cap.toFixed(2)} BNB</span>
            </span>
          )}
          {increase != null && (
            <span className={`token-card-stat-change ${increase >= 0 ? 'pos' : 'neg'}`}>
              {increase >= 0 ? '+' : ''}{(increase * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

/** Main page component. */
export default function MyTokensPage({ onCreateNew, auth, onAnalyze }) {
  useScrollReveal()
  const { address, isConnected } = useAccount()
  const { status: authStatus, accessToken, userId, profile } = auth ?? {}

  const [tokens,  setTokens]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [viewMode, setViewMode] = useState('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const isAuthReady = authStatus === AUTH_STATUS.READY

  // Client-side search/filter across multiple fields
  const filteredTokens = tokens.filter(token => {
    if (!searchQuery) return true
    const term = searchQuery.toLowerCase()
    
    const name = (token.tokenName ?? token.name ?? '').toLowerCase()
    const symbol = (token.shortName ?? '').toLowerCase()
    const desc = (token.description ?? token.desc ?? '').toLowerCase()
    const lore = (token.lore ?? '').toLowerCase()
    const status = (token.status ?? '').toLowerCase()
    
    return name.includes(term) ||
           symbol.includes(term) ||
           desc.includes(term) ||
           lore.includes(term) ||
           status.includes(term)
  })

  // Pagination — different page sizes per view mode
  const pageSize = viewMode === 'grid' ? 12 : 10
  const totalPages = Math.max(1, Math.ceil(filteredTokens.length / pageSize))

  // Clamp current page when switching views or after data changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const visibleTokens = filteredTokens.slice((currentPage - 1) * pageSize, currentPage * pageSize)


  // Fetches user's tokens from Four.meme's authenticated endpoint
  const fetchMine = useCallback(async () => {
    if (!isAuthReady || !accessToken || !userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getMyTokens(accessToken, userId, { pageSize: 300 })
      setTokens(data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [isAuthReady, accessToken, userId])

  // Re-fetch when auth becomes ready or userId changes
  useEffect(() => {
    setTokens([])
    if (isAuthReady) {
      fetchMine()
    }
  }, [isAuthReady, userId])

  const isEmpty = !loading && tokens.length === 0

  return (
    <div className="my-tokens-page reveal">
      {/* Page header with view toggle and create button */}
      <div className="my-tokens-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div className="my-tokens-title-row">
          <Rocket size={28} className="my-tokens-icon" />
          <div>
            <h2 className="my-tokens-h2">My Tokens</h2>
            <p className="my-tokens-sub">View, manage, and analyze all your created tokens on Four.meme BSC</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
          {tokens.length > 0 && (
            <div className="view-mode-toggle">
              <button className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View">
                <LayoutGrid size={18} />
              </button>
              <button className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table View">
                <List size={18} />
              </button>
            </div>
          )}
          <button className="btn-launch" onClick={onCreateNew} style={{ padding: '0 20px', fontSize: '14px' }}>+ Create New</button>
        </div>
      </div>

      {/* Connection state messages */}
      {!isConnected && (
        <div className="tokens-wallet-hint">
          <span>👋</span>
          <span>Connect your MetaMask to see tokens you've created</span>
        </div>
      )}
      {isConnected && !isAuthReady && (
        <div className="tokens-wallet-hint">
          <span>🔑</span>
          <span>
            {authStatus === AUTH_STATUS.PENDING ? 'Check MetaMask — sign to connect to Four.meme…'
             : authStatus === AUTH_STATUS.LOADING ? 'Connecting to Four.meme…'
             : authStatus === AUTH_STATUS.ERROR   ? 'Login failed — retry from header'
             : 'Connecting to Four.meme…'}
          </span>
        </div>
      )}

      {/* Error state with retry */}
      {error && (
        <div className="tokens-error">
          <span>😵 {error}</span>
          <button className="btn-ghost-sm" onClick={() => fetchMine()}>
            retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && tokens.length === 0 && (
        <div className="tokens-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="token-card token-card--skeleton">
              <div className="skeleton-img" />
              <div className="skeleton-body">
                <div className="skeleton-line skeleton-line--wide" />
                <div className="skeleton-line skeleton-line--narrow" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !error && isAuthReady && (
        <div className="tokens-empty">
          <span className="tokens-empty-emoji">🥚</span>
          <p>no tokens yet</p>
          <p className="tokens-empty-sub">your launched tokens will show up here</p>
          <button className="btn-launch" onClick={onCreateNew}>Launch Your First Token →</button>
        </div>
      )}

      {/* Search input */}
      {!isEmpty && tokens.length > 0 && (
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
            <Search size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Search tokens by name, symbol, lore, status..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)',
              padding: '14px 16px 14px 42px',
              fontSize: '14px',
              color: 'var(--text)',
              outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: 'var(--font-body)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--green)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      )}

      {/* No search results */}
      {tokens.length > 0 && filteredTokens.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', background: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px dashed var(--border)' }}>
          <Search size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <div>No tokens matched "{searchQuery}"</div>
        </div>
      )}

      {/* Token list — table or grid based on viewMode */}
      {!isEmpty && filteredTokens.length > 0 && (
        viewMode === 'table' ? (
          <div className="tokens-table-wrap">
            <table className="tokens-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Market Cap</th>
                  <th>24h Change</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTokens.map((token, i) => {
                  const name      = token.tokenName  ?? token.name      ?? '???'
                  const shortName = token.shortName  ?? '???'
                  const img       = resolveImg(token.image ?? token.img ?? token.imgUrl ?? '')
                  const addr      = token.tokenAddress ?? ''
                  const progress  = token.progress   != null ? Number(token.progress) : null
                  const cap       = token.marketCap  ?? token.cap
                  const capNum    = cap != null ? Number(cap) : null
                  const increase  = token.dayIncrease ?? token.day1Increase
                  const incNum    = increase != null ? Number(increase) : null
                  const status    = token.status     ?? ''
                  const pct       = progress != null ? Math.min(100, progress * 100) : null

                  return (
                    <tr key={i} className="tbl-row--hoverable">
                      <td>
                        <div className="tbl-token-col">
                          <div className="tbl-token-img-wrap">
                            {img ? <img src={img} alt={name} /> : <div className="tbl-token-ph">{shortName?.[0]}</div>}
                          </div>
                          <div>
                            <div className="tbl-token-name">{name}</div>
                            <div className="tbl-token-symbol">${shortName}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`token-card-status-pill token-card-status--${status.toLowerCase()}`}>
                          {status === 'PUBLISH' ? '● live' : status === 'INIT' ? '◌ init' : status.toLowerCase()}
                        </span>
                      </td>
                      <td>{pct != null ? (
                          <div className="token-card-progress-wrap" style={{ maxWidth: '100px' }}>
                            <div className="token-card-progress-track">
                              <div className="token-card-progress-fill" style={{ width: `${pct.toFixed(1)}%` }} />
                            </div>
                            <span className="token-card-progress-pct">{pct.toFixed(0)}%</span>
                          </div>
                      ) : '—'}</td>
                      <td>{capNum != null ? `${capNum.toFixed(2)} BNB` : '—'}</td>
                      <td>
                        {incNum != null ? (
                          <span className={`token-card-stat-change ${incNum >= 0 ? 'pos' : 'neg'}`}>
                            {incNum >= 0 ? '+' : ''}{(incNum * 100).toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="tbl-actions-cell">
                        <a href={`https://four.meme/token/${addr}`} target="_blank" rel="noopener"
                          className="tbl-action-btn" onClick={e => e.stopPropagation()} title="See on Four.meme">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                        <button className="tbl-action-btn tbl-action-btn--analyze"
                          onClick={() => onAnalyze && onAnalyze(addr)} title="Analyze with AI">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tokens-grid">
            {visibleTokens.map((token, i) => (
              <TokenCard key={i} token={token} onAnalyze={onAnalyze} />
            ))}
          </div>
        )
      )}

      {/* Pagination controls */}
      {!isEmpty && filteredTokens.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
          <button
            className="btn-ghost-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-ghost-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
