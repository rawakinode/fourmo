import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Zap, TrendingUp, Globe, RefreshCcw, LayoutGrid,
  Info, CheckCircle2, AlertCircle, Loader, ArrowRight,
  TrendingDown, Users, DollarSign, Brain, Target, Star, Sparkles,
  Rocket, Minus, Layout, BarChart2, Hash
} from 'lucide-react'
import { analyzeTrend } from '../lib/apiClient'
import useScrollReveal from '../hooks/useScrollReveal'

// ── Formatting Helpers ──────────────────────────────────────────────────────
const fmt = (n, decimals = 2) => {
  if (!n && n !== 0) return '—'
  const num = parseFloat(n)
  if (isNaN(num)) return '—'
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(1)}B`
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(1)}M`
  if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(1)}K`
  return num.toFixed(decimals)
}

const pct = (n) => {
  if (!n && n !== 0) return '—'
  const num = parseFloat(n)
  if (isNaN(num)) return '—'
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
}

const heatColor = (score) => {
  if (score >= 80) return '#00ff88'
  if (score >= 60) return '#ffe147'
  if (score >= 40) return '#ff7c1e'
  if (score >= 20) return '#4ecdc4'
  return '#4a5568'
}

const sentimentColor = (s) => {
  const S = (s || '').toLowerCase()
  if (S === 'bullish') return '#00ff88'
  if (S === 'bearish') return '#ff5caa'
  return '#ffe147'
}

const chainColor = (chain) => {
  const c = (chain || '').toUpperCase()
  if (c === 'BSC' || c === 'BNB') return '#f3ba2f'
  if (c === 'SOLANA' || c === 'SOL') return '#9945ff'
  if (c === 'ETHEREUM' || c === 'ETH') return '#627eea'
  return '#8896b0'
}

// ── Shared UI Components ────────────────────────────────────────────────────

function ScoreArc({ score, size = 120, colorOverride }) {
  const r = (size / 2) - 12
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ * 0.75
  const color = colorOverride || (score >= 70 ? '#00ff88' : score >= 45 ? '#ffe147' : '#ff5caa')
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
        SCORE
      </text>
    </svg>
  )
}

function SectionLabel({ children }) {
  return <div className="an-section-label animate-reveal">{children}</div>
}

function MetricBar({ label, score, icon }) {
  const color = heatColor(score)
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
    </div>
  )
}

// ── Trend Result View ───────────────────────────────────────────────────────

function TrendResult({ data, onUseIdea }) {
  const { marketPulse: pulse, tokenIdea: idea, themes, categoryHeatmap, topOpportunities, risingPatterns, rawData } = data
  const sColor = sentimentColor(pulse.sentiment)
  const [dataTab, setDataTab] = useState('fourmeme')

  return (
    <div className="an-result">
      {/* Market Pulse Hero */}
      <div className="an-hero animate-reveal">
        <div className="an-hero-left">
          <div className="an-sentiment-badge" style={{ background: `${sColor}18`, border: `1px solid ${sColor}44`, color: sColor }}>
            <span>
              {pulse.sentiment === 'bullish' ? <Rocket size={14} /> : pulse.sentiment === 'bearish' ? <TrendingDown size={14} /> : <Minus size={14} />}
            </span>
            <span>{pulse.sentiment.toUpperCase()} SENTIMENT</span>
          </div>
          <h3 className="an-headline">Detected {pulse.hotChain} chain as current market leader</h3>
          <div className="an-phase-chip">
            <Zap size={12} />
            <span>Hot Ecosystem: {pulse.hotChain}</span>
          </div>
          <p className="an-phase-desc">{pulse.summary}</p>
          <div style={{ fontSize: 13, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={14} />
            <span>{pulse.hotChainReason}</span>
          </div>
        </div>
        <div className="an-hero-right">
          <ScoreArc score={pulse.sentimentScore} size={140} colorOverride={sColor} />
          <div className="an-action-badge" style={{ color: chainColor(pulse.hotChain), borderColor: `${chainColor(pulse.hotChain)}44`, background: `${chainColor(pulse.hotChain)}10` }}>
            <Zap size={14} /> Dominant: {pulse.hotChain}
          </div>
        </div>
      </div>

      {/* AI Token Idea Card */}
      <SectionLabel>ai token idea of the moment</SectionLabel>
      <div className="an-recommendation animate-reveal" style={{ borderColor: '#a855f733', background: 'rgba(168,85,247,0.06)', padding: '28px' }}>
        <div className="an-rec-header" style={{ marginBottom: 16 }}>
          <Star size={20} style={{ color: '#a855f7' }} />
          <strong style={{ color: '#a855f7', fontSize: 20 }}>{idea.name}</strong>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', background: 'rgba(168,85,247,0.1)', padding: '2px 12px', borderRadius: 20 }}>${idea.symbol}</span>
        </div>
        <p style={{ color: '#fbbf24', fontStyle: 'italic', fontSize: 15, marginBottom: 10 }}>"{idea.tagline}"</p>
        <p className="an-rec-reasoning" style={{ fontSize: 15, marginBottom: 20 }}>{idea.desc}</p>
        <div className="an-rec-next">
          <Brain size={16} className="an-summary-icon" />
          <div>
            <strong style={{ color: 'var(--text1)' }}>Viral Catalyst: </strong>
            <span style={{ color: 'var(--text2)' }}>{idea.reasoning}</span>
          </div>
        </div>
      </div>

      {/* Category Heatmap & Top Opportunities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <SectionLabel>category heatmap</SectionLabel>
          <div className="an-scores-grid" style={{ gridTemplateColumns: '1fr', marginTop: 12 }}>
            {Object.entries(categoryHeatmap || {}).sort((a,b)=>b[1]-a[1]).map(([cat, score]) => (
              <MetricBar key={cat} label={cat} score={score} icon={<LayoutGrid size={13} />} />
            ))}
          </div>
        </div>
        <div>
          <SectionLabel>top opportunities</SectionLabel>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(topOpportunities || []).map((op, i) => (
              <div key={i} className="an-metric animate-reveal" style={{ borderLeft: `3px solid ${chainColor(op.chain)}` }}>
                <div className="an-metric-body" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{op.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: chainColor(op.chain) }}>{op.chain}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0, lineHeight: 1.5 }}>{op.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Themes */}
      <SectionLabel>trending themes</SectionLabel>
      <div className="an-metrics-grid animate-reveal" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {(themes || []).map((theme, i) => (
          <div key={i} className="an-metric" style={{ borderLeft: `3px solid ${heatColor(theme.heatScore)}` }}>
            <div className="an-metric-icon" style={{ color: heatColor(theme.heatScore), marginTop: 4 }}>
              <Hash size={24} />
            </div>
            <div className="an-metric-body" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="an-metric-value" style={{ fontSize: 16 }}>{theme.name}</span>
                <span style={{ fontSize: 11, color: heatColor(theme.heatScore), fontWeight: 800 }}>{theme.heatScore}%</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)', margin: '4px 0', lineHeight: 1.4 }}>{theme.description}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {theme.chains?.map(c => <span key={c} style={{ fontSize: 10, color: chainColor(c), background: `${chainColor(c)}15`, padding: '2px 8px', borderRadius: 99 }}>{c}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Data Feed (Tabs) */}
      <SectionLabel>live data feed</SectionLabel>
      <div className="an-picker-wrap animate-reveal">
        <div className="an-picker-list">
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
            <button
              className={`nav-item ${dataTab === 'fourmeme' ? 'nav-item--active' : ''}`}
              onClick={() => setDataTab('fourmeme')}
              style={{ flex: 1, padding: '16px', border: 'none', background: 'none', color: dataTab === 'fourmeme' ? 'var(--green)' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Layout size={14} /> Four.meme
            </button>
            <button
              className={`nav-item ${dataTab === 'dexscreener' ? 'nav-item--active' : ''}`}
              onClick={() => setDataTab('dexscreener')}
              style={{ flex: 1, padding: '16px', border: 'none', background: 'none', color: dataTab === 'dexscreener' ? 'var(--green)' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <BarChart2 size={14} /> DexScreener
            </button>
          </div>

          <div style={{ padding: '12px', minHeight: '200px' }}>
            {dataTab === 'fourmeme' && (
              (() => {
                const combined = [
                  ...(rawData.fourMeme?.hot || []).map(t => ({ ...t, rankType: 'HOT' })),
                  ...(rawData.fourMeme?.vol || []).map(t => ({ ...t, rankType: 'VOL' })),
                  ...(rawData.fourMeme?.prog || []).map(t => ({ ...t, rankType: 'PROG' }))
                ]
                // Deduplicate by symbol
                const unique = Array.from(new Map(combined.map(t => [t.symbol, t])).values())
                
                return unique.length > 0 ? unique.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</span>
                      <span style={{ fontSize: 11, color: t.rankType === 'HOT' ? '#ff5caa' : t.rankType === 'VOL' ? '#fbbf24' : '#00ff88', background: 'rgba(255,255,255,0.03)', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>{t.rankType}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>${t.symbol}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.increase24h >= 0 ? '#00ff88' : '#ff5caa' }}>{pct(t.increase24h * 100)}</span>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: 14 }}>No live Four.meme data found</div>
                )
              })()
            )}
            {dataTab === 'dexscreener' && (rawData.dexScreener?.boosted || []).map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name || b.address?.slice(0,10)}</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                   {b.totalAmount && <span style={{ fontSize: 11, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={10} /> {b.totalAmount}</span>}
                   <span style={{ fontSize: 10, color: chainColor(b.chain), background: `${chainColor(b.chain)}15`, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{b.chain}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Main Page Component ─────────────────────────────────────────────────────

export default function TrendPage() {
  useScrollReveal()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTrends = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeTrend()
      const hotCount = result.rawData.fourMeme.hot.length
      const volCount = result.rawData.fourMeme.vol.length
      const progCount = result.rawData.fourMeme.prog.length
      console.log(`[trend] Four.meme fetched: ${hotCount} hot, ${volCount} vol, ${progCount} progress`)
      setData(result)
    } catch (e) {
      console.warn('[trend] four.meme fetch error:', e.message)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Remove auto-fetch on mount
  useEffect(() => {
    // Initial fetch removed as per user request
  }, [])

  const handleUseIdea = (ideaObj) => {
    const ideaText = encodeURIComponent(`${ideaObj.name} - ${ideaObj.desc}`)
    navigate(`/create?idea=${ideaText}`)
  }

  return (
    <div className="an-page reveal">
      {/* Page Header */}
      <div className="an-page-header">
        <div className="an-page-title-row">
          <Activity size={28} className="an-page-icon" />
          <div style={{ flex: 1 }}>
            <h2 className="an-page-h2">AI Trend Discovery</h2>
            <p className="an-page-sub">Analyze real-time market trends to generate viral meme ideas across all chains</p>
          </div>
          {data && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="an-search-btn"
                style={{ width: 'auto', padding: '0 24px', height: '44px', borderRadius: '14px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
                onClick={() => setData(null)}
              >
                <RefreshCcw size={16} />
                <span>New Scan</span>
              </button>
              <button
                className="an-search-btn"
                style={{ width: 'auto', padding: '0 24px', height: '44px', borderRadius: '14px' }}
                onClick={() => handleUseIdea(data.tokenIdea)}
              >
                <Sparkles size={16} />
                <span>Use This Idea</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="an-error" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button 
            onClick={fetchTrends}
            className="an-ext-btn"
            style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(255,107,138,0.1)', borderColor: 'rgba(255,107,138,0.3)', color: '#ff6b8a' }}
          >
            Retry Scan
          </button>
        </div>
      )}

      {loading && !data && (
        <div className="an-analyzing">
          <div className="an-analyzing-orb">
            <div className="an-orb-ring an-orb-ring--1" />
            <div className="an-orb-ring an-orb-ring--2" />
            <div className="an-orb-ring an-orb-ring--3" />
            <Activity size={28} className="an-orb-icon" />
          </div>
          <h3>Scanning multi-chain markets…</h3>
          <p>Fetching data from BSC, Solana, and Ethereum networks</p>
          <div className="an-analyzing-steps">
            {['Scanning Four.meme ecosystem', 'Enriching with DexScreener signals', 'AI market synthesis'].map((s, i) => (
              <div key={i} className="an-analyzing-step">
                <Loader size={12} className="spin-anim" style={{ opacity: 0.6 }} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && !loading && <TrendResult data={data} onUseIdea={handleUseIdea} />}

      {!loading && !data && (
        <div className="an-analyzing" style={{ padding: '80px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-2xl)' }}>
          <div className="an-analyzing-orb">
             <div className="an-orb-ring an-orb-ring--1" style={{ borderColor: 'var(--green)' }} />
             <div className="an-orb-ring an-orb-ring--2" style={{ borderColor: 'var(--green)' }} />
             <Brain size={42} style={{ color: 'var(--green)', zIndex: 1 }} />
          </div>
          <h3 style={{ marginTop: 20 }}>Ready to find your next gem?</h3>
          <p style={{ maxWidth: 400, margin: '0 auto 24px' }}>AI will scan Four.meme and DexScreener to identify hot themes and generate a high-potential meme idea for you.</p>
          <button 
            className="an-search-btn" 
            onClick={fetchTrends}
            style={{ width: 'auto', padding: '16px 40px', borderRadius: '14px', fontSize: 16, background: 'var(--green)', color: '#04060a', boxShadow: '0 0 30px var(--green-glow2)' }}
          >
            <Sparkles size={18} /> Get AI Trend Ideas
          </button>
        </div>
      )}

    </div>
  )
}
