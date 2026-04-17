/**
 * AnalysisPage.jsx
 *
 * AI-powered token health analysis page. Users can:
 *   - Enter a token address for direct analysis
 *   - Enter a wallet address to find and pick tokens from it
 *   - Quick-pick from trending tokens on Four.meme
 *
 * The analysis report includes: overall score, 4-dimension breakdown
 * (momentum, community, curve, virality), live metrics, signals
 * (alerts/strengths/weaknesses), and an actionable recommendation.
 *
 * Supports DexScreener enrichment for graduated tokens with USD pricing,
 * liquidity, and transaction data.
 */

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Brain, Search, TrendingUp, TrendingDown, Users, Activity,
  Zap, Target, AlertTriangle, CheckCircle, ArrowRight,
  ExternalLink, RefreshCw, Clock, BarChart2, Droplets,
  Shield, Star, ChevronRight, Loader, Info, ArrowUpDown,
  DollarSign
} from 'lucide-react'
import { getTokenDetail, getTokenList, resolveImg } from '../lib/fourmeme'
import { analyzeToken } from '../lib/apiClient'
import useScrollReveal from '../hooks/useScrollReveal'

// Formatting helpers
const isAddress = (s) => /^0x[0-9a-fA-F]{40}$/.test(s?.trim())
const fmtBnb = (v) => { const n = parseFloat(v ?? 0); return isNaN(n) ? '—' : n.toFixed(4) + ' BNB' }
const fmtPct = (v) => { const n = parseFloat(v ?? 0); return isNaN(n) ? '—' : (n >= 0 ? '+' : '') + n.toFixed(2) + '%' }
const fmtUsd = (v) => {
  const n = parseFloat(v ?? 0)
  if (isNaN(n) || n === 0) return '—'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K'
  return '$' + n.toFixed(2)
}
const fmtAge = (h) => {
  if (h == null) return '—'
  if (h < 1) return '< 1h'
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

// Visual config for sentiment badges
const SENTIMENT_CONFIG = {
  bullish: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)', icon: '🚀' },
  neutral: { color: '#8896b0', bg: 'rgba(136,150,176,0.1)', border: 'rgba(136,150,176,0.3)', icon: '😐' },
  bearish: { color: '#ff5caa', bg: 'rgba(255,92,170,0.1)', border: 'rgba(255,92,170,0.3)', icon: '🐻' },
  graduated: { color: '#ffe147', bg: 'rgba(255,225,71,0.1)', border: 'rgba(255,225,71,0.3)', icon: '🎓' },
  dormant: { color: '#4a5568', bg: 'rgba(74,85,104,0.1)', border: 'rgba(74,85,104,0.3)', icon: '😴' },
}

// Visual config for recommendation action badges
const ACTION_CONFIG = {
  HOLD: { color: '#ffe147', icon: <Shield size={14} />, label: 'Hold & Watch' },
  PROMOTE: { color: '#00ff88', icon: <Zap size={14} />, label: 'Promote Now' },
  WATCH: { color: '#4d9fff', icon: <Target size={14} />, label: 'Keep Watching' },
  GRADUATED: { color: '#ffe147', icon: <Star size={14} />, label: 'Graduated' },
  STALE: { color: '#8896b0', icon: <Clock size={14} />, label: 'Needs Attention' },
}

/** SVG arc chart for overall score (0-100) with color coding. */
function ScoreArc({ score, size = 120 }) {
  const r = (size / 2) - 12
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ * 0.75
  const color = score >= 70 ? '#00ff88' : score >= 45 ? '#ffe147' : '#ff5caa'
  const rotation = -225

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--border)" strokeWidth={10}
        strokeDasharray={`${circ * 0.75} ${circ}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
      />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle"
        fill={color} fontSize={size * 0.22} fontWeight="800" fontFamily="var(--font-disp)">
        {score}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle"
        fill="var(--text3)" fontSize={size * 0.09} fontFamily="var(--font-mono)">
        /100
      </text>
    </svg>
  )
}

/** Single dimension score bar with label, value, and optional insight text. */
function ScoreBar({ label, score, insight, icon }) {
  const color = score >= 70 ? '#00ff88' : score >= 45 ? '#ffe147' : '#ff5caa'
  return (
    <div className="an-score-bar">
      <div className="an-score-bar-header">
        <div className="an-score-bar-label">
          {icon}
          <span>{label}</span>
        </div>
        <span className="an-score-bar-num" style={{ color }}>{score}</span>
      </div>
      <div className="an-score-bar-track">
        <div className="an-score-bar-fill"
          style={{ width: `${score}%`, background: color, boxShadow: `0 0 8px ${color}66` }} />
      </div>
      {insight && <p className="an-score-bar-insight">{insight}</p>}
    </div>
  )
}

/** Metric card for displaying a single data point (cap, holders, volume, etc.). */
function MetricCard({ label, value, sub, icon, highlight }) {
  return (
    <div className={`an-metric ${highlight ? 'an-metric--highlight' : ''}`}>
      <div className="an-metric-icon">{icon}</div>
      <div className="an-metric-body">
        <span className="an-metric-label">{label}</span>
        <span className="an-metric-value">{value}</span>
        {sub && <span className="an-metric-sub">{sub}</span>}
      </div>
    </div>
  )
}

/** Colored chip for alerts, strengths, or weaknesses. */
function Chip({ text, type }) {
  const cfg = {
    alert: { icon: <AlertTriangle size={12} />, cls: 'chip--alert' },
    strength: { icon: <CheckCircle size={12} />, cls: 'chip--strength' },
    weakness: { icon: <TrendingDown size={12} />, cls: 'chip--weakness' },
  }[type]
  return (
    <div className={`an-chip ${cfg.cls}`}>
      {cfg.icon}
      <span>{text}</span>
    </div>
  )
}

/** Full analysis result view with all sections. */
function AnalysisResult({ report, tokenMeta, onRefresh, loading }) {
  const s = SENTIMENT_CONFIG[report.sentiment] ?? SENTIMENT_CONFIG.neutral
  const ac = ACTION_CONFIG[report.recommendation?.action] ?? ACTION_CONFIG.WATCH
  const m = report.metrics ?? {}
  const img = resolveImg(tokenMeta?.img ?? tokenMeta?.image ?? tokenMeta?.imgUrl ?? '')
  const name = tokenMeta?.name ?? tokenMeta?.tokenName ?? 'Unknown'
  const shortName = tokenMeta?.shortName ?? '???'
  const addr = m.tokenAddress ?? tokenMeta?.tokenAddress ?? ''

  return (
    <div className="an-result">
      {/* Token identity bar */}
      <div className="an-identity animate-reveal">
        <div className="an-identity-logo">
          {img
            ? <img src={img} alt={name} onError={e => { e.currentTarget.style.display = 'none' }} />
            : <div className="an-identity-logo-ph">{shortName[0]}</div>
          }
        </div>
        <div className="an-identity-info">
          <h2 className="an-identity-name">{name}</h2>
          <div className="an-identity-row">
            <span className="an-identity-sym">${shortName}</span>
            <span className="an-identity-tag">{tokenMeta?.tag ?? tokenMeta?.label ?? 'Meme'}</span>
            <span className="an-identity-addr">{addr.slice(0, 8)}…{addr.slice(-6)}</span>
          </div>
        </div>
        <div className="an-identity-actions">
          <button className="an-refresh-btn" onClick={onRefresh} disabled={loading}
            title="Re-analyze">
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          </button>
          <a href={`https://four.meme/token/${addr}`} target="_blank" rel="noopener"
            className="an-ext-btn" title="Open on Four.meme">
            <ExternalLink size={14} />
          </a>
          <a href={`https://bscscan.com/token/${addr}`} target="_blank" rel="noopener"
            className="an-ext-btn" title="View on BSCScan">
            <BarChart2 size={14} />
          </a>
        </div>
      </div>

      {/* Headline, sentiment badge, and overall score arc */}
      <div className="an-hero animate-reveal reveal-delay-1">
        <div className="an-hero-left">
          <div className="an-sentiment-badge" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
            <span>{s.icon}</span>
            <span>{report.sentiment?.toUpperCase()}</span>
          </div>
          <h3 className="an-headline">{report.headline}</h3>
          <div className="an-phase-chip">
            <ChevronRight size={12} />
            <span>{report.phase?.name}</span>
          </div>
          <p className="an-phase-desc">{report.phase?.description}</p>
        </div>
        <div className="an-hero-right">
          <ScoreArc score={report.overall ?? 0} size={130} />
          <div className="an-action-badge" style={{ color: ac.color, borderColor: `${ac.color}44`, background: `${ac.color}10` }}>
            {ac.icon} {ac.label}
          </div>
        </div>
      </div>

      {/* Live metrics grid */}
      <div className="an-section-label animate-reveal reveal-delay-2">live metrics</div>
      {!m.holderDataAvailable && (
        <div className="an-info-banner animate-reveal reveal-delay-2">
          <Info size={14} />
          <span>
            Holder data not available for this token type.
            {m.dexTxns24h != null ? ' Using DEX transaction data as community activity proxy.' : ''}
          </span>
        </div>
      )}
      <div className="an-metrics-grid animate-reveal reveal-delay-2">
        <MetricCard label="Bonding Curve" value={`${m.progress}%`}
          icon={<Activity size={16} />} highlight={parseFloat(m.progress) > 50} />
        <MetricCard label="Market Cap" value={m.dexMarketCapUsd ? fmtUsd(m.dexMarketCapUsd) : fmtBnb(m.cap)}
          sub={m.dexMarketCapUsd ? 'from DexScreener' : null}
          icon={<BarChart2 size={16} />} />
        {m.holderDataAvailable ? (
          <MetricCard label="Holders" value={m.holders || '—'}
            icon={<Users size={16} />} highlight={m.holders > 20} />
        ) : m.dexTxns24h != null ? (
          <MetricCard label="24h Txns" value={m.dexTxns24h.toLocaleString()}
            sub={`${m.dexTxns24hBuys} buys · ${m.dexTxns24hSells} sells`}
            icon={<ArrowUpDown size={16} />} highlight={m.dexTxns24h > 200} />
        ) : (
          <MetricCard label="Holders" value="N/A"
            sub="unavailable" icon={<Users size={16} />} />
        )}
        <MetricCard label="Volume 24h" value={m.dexVolume24hUsd ? fmtUsd(m.dexVolume24hUsd) : fmtBnb(m.volume24h)}
          sub={m.dexVolume24hUsd ? 'from DexScreener' : null}
          icon={<Droplets size={16} />} />
        <MetricCard label="Price" value={m.dexPriceUsd ? ('$' + parseFloat(m.dexPriceUsd).toFixed(6)) : (m.price || '—')}
          sub={m.dexPriceUsd ? 'USD' : 'BNB per token'} icon={<TrendingUp size={16} />} />
        <MetricCard label="24h Change" value={fmtPct(m.change24h)}
          icon={parseFloat(m.change24h) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          highlight={parseFloat(m.change24h) > 10} />
        {m.dexLiquidityUsd != null && (
          <MetricCard label="Liquidity" value={fmtUsd(m.dexLiquidityUsd)}
            sub="DEX pool" icon={<DollarSign size={16} />}
            highlight={m.dexLiquidityUsd > 100000} />
        )}
        {m.dexBuySellRatio != null && (
          <MetricCard label="Buy/Sell Ratio"
            value={m.dexBuySellRatio.toFixed(2)}
            sub={m.dexBuySellRatio >= 1 ? 'bullish' : m.dexBuySellRatio >= 0.5 ? 'neutral' : 'bearish'}
            icon={<ArrowUpDown size={16} />}
            highlight={m.dexBuySellRatio >= 1} />
        )}
        <MetricCard label="Token Age" value={fmtAge(m.ageHours)}
          icon={<Clock size={16} />} />
        <MetricCard label="Status" value={m.isGraduated ? 'Graduated 🎓' : m.status || '—'}
          icon={<Shield size={16} />} highlight={m.isGraduated} />
      </div>

      {/* AI score breakdown — 4 dimensions */}
      <div className="an-section-label animate-reveal reveal-delay-3">ai score breakdown</div>
      <div className="an-scores-grid animate-reveal reveal-delay-3">
        <ScoreBar label="Momentum" score={report.dimensions?.momentum?.score ?? 0}
          insight={report.dimensions?.momentum?.insight}
          icon={<Zap size={13} />} />
        <ScoreBar label="Community" score={report.dimensions?.community?.score ?? 0}
          insight={report.dimensions?.community?.insight}
          icon={<Users size={13} />} />
        <ScoreBar label="Curve" score={report.dimensions?.curve?.score ?? 0}
          insight={report.dimensions?.curve?.insight}
          icon={<Activity size={13} />} />
        <ScoreBar label="Virality" score={report.dimensions?.virality?.score ?? 0}
          insight={report.dimensions?.virality?.insight}
          icon={<TrendingUp size={13} />} />
      </div>

      {/* Signals: alerts, strengths, weaknesses */}
      {(report.alerts?.length > 0 || report.strengths?.length > 0 || report.weaknesses?.length > 0) && (
        <>
          <div className="an-section-label animate-reveal reveal-delay-4">signals</div>
          <div className="an-chips-wrap animate-reveal reveal-delay-4">
            {report.alerts?.map((a, i) => <Chip key={`a${i}`} text={a} type="alert" />)}
            {report.strengths?.map((s, i) => <Chip key={`s${i}`} text={s} type="strength" />)}
            {report.weaknesses?.map((w, i) => <Chip key={`w${i}`} text={w} type="weakness" />)}
          </div>
        </>
      )}

      {/* Recommendation */}
      <div className="an-section-label animate-reveal reveal-delay-5">recommendation</div>
      <div className="an-recommendation animate-reveal reveal-delay-5" style={{ borderColor: `${ac.color}33`, background: `${ac.color}08` }}>
        <div className="an-rec-header">
          <span style={{ color: ac.color }}>{ac.icon}</span>
          <strong style={{ color: ac.color }}>{ac.label}</strong>
        </div>
        <p className="an-rec-reasoning">{report.recommendation?.reasoning}</p>
        {report.recommendation?.nextStep && (
          <div className="an-rec-next">
            <ArrowRight size={13} />
            <span>{report.recommendation.nextStep}</span>
          </div>
        )}
      </div>

      {/* AI Summary */}
      <div className="an-section-label animate-reveal reveal-delay-5">ai summary</div>
      <div className="an-summary animate-reveal reveal-delay-5">
        <Brain size={16} className="an-summary-icon" />
        <p>{report.summary}</p>
      </div>
    </div>
  )
}

/** Token picker shown when a wallet address is searched instead of a token address. */
function WalletTokenPicker({ tokens, onPick, loading }) {
  if (loading) return (
    <div className="an-picker-loading">
      <Loader size={18} className="spin-anim" />
      <span>Scanning tokens…</span>
    </div>
  )
  if (!tokens.length) return (
    <div className="an-picker-empty">No tokens found for this wallet</div>
  )
  return (
    <div className="an-picker-list">
      <p className="an-picker-hint">{tokens.length} token{tokens.length !== 1 ? 's' : ''} found — pick one to analyze:</p>
      {tokens.map((t, i) => {
        const name = t.name ?? t.tokenName ?? '???'
        const sym = t.shortName ?? '???'
        const img = resolveImg(t.img ?? t.image ?? '')
        const pct = t.progress != null ? (parseFloat(t.progress) * 100).toFixed(0) : null
        const addr = t.tokenAddress ?? t.address ?? ''
        return (
          <button key={i} className="an-picker-item" onClick={() => onPick(t)}>
            <div className="an-picker-item-img">
              {img ? <img src={img} alt={name} onError={e => { e.currentTarget.style.display = 'none' }} />
                : <div className="an-picker-item-ph">{sym[0]}</div>}
            </div>
            <div className="an-picker-item-info">
              <span className="an-picker-item-name">{name}</span>
              <span className="an-picker-item-sym">${sym}</span>
            </div>
            {pct != null && (
              <div className="an-picker-item-progress">
                <div className="an-picker-prog-track">
                  <div className="an-picker-prog-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="an-picker-prog-pct">{pct}%</span>
              </div>
            )}
            <ChevronRight size={14} className="an-picker-arrow" />
          </button>
        )
      })}
    </div>
  )
}

/** Main page component. */
export default function AnalysisPage() {
  useScrollReveal()
  const [searchParams] = useSearchParams()

  const [input, setInput] = useState(searchParams.get('address') ?? '')
  const [inputError, setInputError] = useState('')

  // Wallet search mode — shows token picker when a wallet address is entered
  const [walletTokens, setWalletTokens] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)

  const [selectedToken, setSelectedToken] = useState(null)

  // Analysis state
  const [report, setReport] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setError] = useState(null)

  // Trending tokens for quick-pick suggestions
  const [hotTokens, setHotTokens] = useState([])

  // Auto-analyze if address query param is present (linked from My Tokens page)
  useEffect(() => {
    const addr = searchParams.get('address')
    if (addr && isAddress(addr)) {
      setInput(addr)
      runTokenAnalysis(addr)
    }

    // Fetch trending tokens for suggestions
    getTokenList({ type: 'HOT', listType: 'ADV', pageIndex: 1, pageSize: 5 })
      .then(list => setHotTokens(list ?? []))
      .catch(e => console.error('Failed to fetch hot tokens', e))
  }, [])

  /**
   * Smart search: tries token address first, falls back to wallet address.
   * Token addresses resolve to direct analysis; wallet addresses show a picker.
   */
  const handleSearch = useCallback(async () => {
    const val = input.trim()
    if (!val) { setInputError('Enter a token address or wallet address'); return }
    if (!isAddress(val)) { setInputError('Invalid address format'); return }
    setInputError('')
    setReport(null)
    setWalletTokens(null)
    setSelectedToken(null)
    setError(null)

    // Try as token address first
    setAnalyzing(true)
    try {
      const detail = await getTokenDetail(val)
      if (detail && (detail.name || detail.tokenName)) {
        setSelectedToken({ ...detail, tokenAddress: val })
        await runAnalysis(val, detail)
        return
      }
    } catch (_) { /* not a token — try as wallet */ }

    // Fall back to wallet address search
    setAnalyzing(false)
    setWalletLoading(true)
    try {
      const tokens = await getTokenList({ type: 'NEW', pageSize: 50, pageIndex: 1, status: 'ALL' })
      const lower = val.toLowerCase()
      const mine = tokens.filter(t => (t.userAddress ?? '').toLowerCase() === lower)
      setWalletTokens(mine)
    } catch (e) {
      setError('Failed to search: ' + e.message)
    } finally {
      setWalletLoading(false)
    }
  }, [input])

  /**
   * Runs AI analysis for a token.
   * Flattens tokenPrice data from Four.meme's nested API response format.
   */
  const runAnalysis = useCallback(async (addr, detail) => {
    setAnalyzing(true)
    setError(null)
    setReport(null)
    try {
      const tp = detail.tokenPrice ?? {}

      const result = await analyzeToken(addr, {
        name: detail.name ?? detail.tokenName,
        shortName: detail.shortName,
        desc: detail.descr ?? detail.desc ?? detail.description ?? '',
        tag: detail.tag ?? detail.label,
        status: detail.status,
        progress: tp.progress ?? detail.progress,
        cap: tp.marketCap ?? detail.cap ?? detail.marketCap,
        holders: tp.holderCount ?? detail.hold ?? detail.holders,
        volume: tp.trading ?? detail.volume ?? detail.day1Vol,
        price: tp.price ?? detail.price ?? detail.lastPrice,
        increase: tp.dayIncrease ?? detail.increase ?? detail.day1Increase ?? detail.dayIncrease,
        createDate: detail.createDate ?? tp.createDate,
        liquidityAdded: detail.liquidityAdded,
        tradingUsd: tp.tradingUsd,
        dayTrading: tp.dayTrading,
        raisedAmount: tp.raisedAmount ?? detail.raisedAmount,
        liquidity: tp.liquidity,
        hourIncrease: tp.hourIncrease,
        fourHourIncrease: tp.fourHourIncrease,
        maxPrice: tp.maxPrice,
      })
      setReport(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }, [])

  /** Direct analysis by token address (called from My Tokens page deep link). */
  const runTokenAnalysis = useCallback(async (addr) => {
    setAnalyzing(true)
    setError(null)
    setReport(null)
    try {
      const detail = await getTokenDetail(addr)
      setSelectedToken({ ...detail, tokenAddress: addr })
      await runAnalysis(addr, detail)
    } catch (e) {
      setError('Could not fetch token: ' + e.message)
      setAnalyzing(false)
    }
  }, [runAnalysis])

  /** Handle token selection from wallet picker — fetches full details then analyzes. */
  const handlePickToken = useCallback(async (token) => {
    const addr = token.tokenAddress ?? token.address
    setSelectedToken(token)
    setWalletTokens(null)
    setInput(addr)
    setAnalyzing(true)
    setError(null)
    try {
      let detail = token
      try { detail = await getTokenDetail(addr) } catch (_) { }
      await runAnalysis(addr, { ...token, ...detail })
    } catch (e) {
      setError(e.message)
      setAnalyzing(false)
    }
  }, [runAnalysis])

  const handleRefresh = useCallback(() => {
    if (selectedToken) {
      const addr = selectedToken.tokenAddress ?? input
      runAnalysis(addr, selectedToken)
    }
  }, [selectedToken, input, runAnalysis])

  return (
    <div className="an-page reveal">
      {/* Page header */}
      <div className="an-page-header">
        <div className="an-page-title-row">
          <Brain size={28} className="an-page-icon" />
          <div>
            <h2 className="an-page-h2">AI Token Analysis</h2>
            <p className="an-page-sub">AI-powered deep analysis for any token on Four.meme BSC</p>
          </div>
        </div>
      </div>

      {/* Search input */}
      <div className="an-search-wrap">
        <div className="an-search-box">
          <Search size={18} className="an-search-icon" />
          <input
            className="an-search-input"
            placeholder="Enter token address (0x…) or wallet address to find tokens"
            value={input}
            onChange={e => { setInput(e.target.value); setInputError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            disabled={analyzing || walletLoading}
          />
          {input && (
            <button className="an-search-clear" onClick={() => {
              setInput(''); setReport(null); setWalletTokens(null);
              setSelectedToken(null); setInputError(''); setError(null)
            }}>✕</button>
          )}
        </div>
        <button
          className="an-search-btn"
          onClick={handleSearch}
          disabled={analyzing || walletLoading || !input.trim()}
        >
          {(analyzing || walletLoading)
            ? <><Loader size={15} className="spin-anim" /> Analyzing…</>
            : <><Brain size={15} /> Analyze</>
          }
        </button>
      </div>

      {inputError && <p className="an-input-error">{inputError}</p>}

      {/* Trending token quick-pick chips */}
      {!report && !analyzing && !walletTokens && hotTokens.length > 0 && (
        <div className="an-helper">
          <span className="an-helper-label">Try with:</span>
          {hotTokens.map((t, i) => (
            <button
              key={i}
              className="an-helper-chip"
              onClick={() => {
                const addr = t.tokenAddress ?? t.address;
                setInput(addr);
                runTokenAnalysis(addr);
              }}
            >
              ${t.shortName}
            </button>
          ))}
        </div>
      )}

      {/* Analyzing loading state */}
      {analyzing && (
        <div className="an-analyzing">
          <div className="an-analyzing-orb">
            <div className="an-orb-ring an-orb-ring--1" />
            <div className="an-orb-ring an-orb-ring--2" />
            <div className="an-orb-ring an-orb-ring--3" />
            <Brain size={28} className="an-orb-icon" />
          </div>
          <h3>Analyzing token…</h3>
          <p>Fetching on-chain data and generating AI health report</p>
          <div className="an-analyzing-steps">
            {['Fetching token data', 'Reading bonding curve', 'AI analysis in progress', 'Generating report'].map((s, i) => (
              <div key={i} className="an-analyzing-step">
                <Loader size={12} className="spin-anim" style={{ opacity: 0.6 }} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet token picker */}
      {walletTokens !== null && !analyzing && (
        <div className="an-picker-wrap">
          <WalletTokenPicker
            tokens={walletTokens}
            onPick={handlePickToken}
            loading={walletLoading}
          />
        </div>
      )}

      {/* Error state */}
      {analysisError && !analyzing && (
        <div className="an-error">
          <AlertTriangle size={18} />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Analysis result */}
      {report && !analyzing && selectedToken && (
        <AnalysisResult
          report={report}
          tokenMeta={selectedToken}
          onRefresh={handleRefresh}
          loading={analyzing}
        />
      )}
    </div>
  )
}
