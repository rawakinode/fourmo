/**
 * TokenPreviewNew.jsx
 *
 * Token preview card shown after AI generation completes.
 * Displays the generated token concept (name, symbol, logo, description,
 * lore, tweet) with inline editing support. Includes the AI Viral Score
 * panel that scores the token's meme potential via the backend.
 *
 * Users can edit fields, review the viral score, then launch to Four.meme
 * or start over with a new idea.
 */

import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, FileText, AlertCircle, Lock, Clock, ArrowUp, Key, Rocket,
  Edit2, Zap, TrendingUp, Flame, Star, Lightbulb, RotateCcw
} from 'lucide-react'

// Four.meme category labels
const LABELS = ['Meme', 'AI', 'Defi', 'Games', 'Infra', 'De-Sci', 'Social', 'Depin', 'Charity', 'Others']
const NAME_MAX_LENGTH = 20

/** Validates token name against Four.meme constraints. */
function validateName(name) {
  if (!name || name.trim().length === 0) return 'Token name is required'
  if (name.length > NAME_MAX_LENGTH) return `Max ${NAME_MAX_LENGTH} chars (current: ${name.length})`
  return null
}

/** Single dimension bar in the viral score panel. */
function ScoreDimBar({ label, icon: Icon, value }) {
  const color = value >= 80 ? 'var(--green)' : value >= 60 ? 'var(--yellow)' : 'var(--pink)'
  return (
    <div className="vs-dim">
      <div className="vs-dim-row">
        <Icon size={11} style={{ color: 'var(--text3)', flexShrink: 0 }} />
        <span className="vs-dim-label">{label}</span>
        <span className="vs-dim-val" style={{ color }}>{value}</span>
      </div>
      <div className="vs-bar-track">
        <div className="vs-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

/**
 * AI Viral Score panel.
 * Auto-fetches a score on mount, scoring the token across 4 dimensions:
 * catchiness, relatability, meme potential, and market timing.
 * Includes a ring chart for overall score, dimension bars, verdict, and tips.
 */
function ViralScorePanel({ data }) {
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const fetchedRef = useRef(false)

  const analyze = async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/score-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, shortName: data.shortName, desc: data.desc, lore: data.lore, tagline: data.tagline, label: data.label }),
      })
      if (!res.ok) throw new Error('failed')
      setScore(await res.json())
    } catch { setErr('Analysis failed.') }
    finally { setLoading(false) }
  }

  // Auto-analyze once on mount
  useEffect(() => {
    if (!fetchedRef.current && data?.name) { fetchedRef.current = true; analyze() }
  }, [])

  const scoreColor = (n) => n >= 80 ? 'var(--green)' : n >= 60 ? 'var(--yellow)' : 'var(--pink)'
  const scoreLabel = (n) => n >= 85 ? '🔥 viral potential' : n >= 70 ? '💪 solid concept' : n >= 55 ? '🛠 needs work' : '💀 needs rethink'

  const circumference = 2 * Math.PI * 30

  return (
    <div className="preview-box preview-box--score">
      <div className="vs-header">
        <Sparkles size={14} style={{ color: 'var(--yellow)' }} />
        <span className="preview-lore-label" style={{ flex: 1 }}>ai viral score</span>
        {!loading && (
          <button className="vs-refresh" onClick={() => { setScore(null); analyze() }} title="Re-analyze">
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {loading && (
        <div className="vs-loading">
          <div className="vs-dots"><span /><span /><span /></div>
          <span>analyzing viral potential…</span>
        </div>
      )}

      {err && !loading && (
        <div className="vs-error">
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{err}</span>
          <button onClick={() => { setScore(null); analyze() }} className="vs-retry">retry</button>
        </div>
      )}

      {score && !loading && (
        <div className="vs-content">
          {/* SVG ring chart */}
          <div className="vs-ring-wrap">
            <svg width="80" height="80" viewBox="0 0 80 80" className="vs-ring-svg">
              <circle cx="40" cy="40" r="30" fill="none" stroke="var(--surface2)" strokeWidth="7" />
              <circle cx="40" cy="40" r="30" fill="none"
                stroke={scoreColor(score.overall)} strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - score.overall / 100)}
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
              />
            </svg>
            <div className="vs-ring-num" style={{ color: scoreColor(score.overall) }}>
              {score.overall}
            </div>
          </div>
          <div className="vs-ring-label">{scoreLabel(score.overall)}</div>

          {/* Dimension score bars */}
          <div className="vs-dims">
            <ScoreDimBar label="catchiness" icon={Star} value={score.catchiness} />
            <ScoreDimBar label="relatability" icon={TrendingUp} value={score.relatability} />
            <ScoreDimBar label="meme potential" icon={Flame} value={score.memePotential} />
            <ScoreDimBar label="market timing" icon={Zap} value={score.marketTiming} />
          </div>

          {/* Verdict */}
          {score.verdict && <p className="vs-verdict">{score.verdict}</p>}

          {/* Improvement tips */}
          {score.tips?.length > 0 && (
            <div className="vs-tips">
              {score.tips.map((tip, i) => (
                <div key={i} className="vs-tip">
                  <Lightbulb size={11} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 2 }} />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Main token preview component with edit mode, lore, tweet, score, and deploy actions. */
export default function TokenPreviewNew({ data, onEdit, onDeploy, onReset, isConnected, isAuthReady, authStatus }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...data })
  const nameError = editing ? validateName(draft.name) : null

  const save = () => { onEdit(draft); setEditing(false) }
  const cancel = () => { setDraft({ ...data }); setEditing(false) }

  return (
    <div className="preview-container">
      <h1 className="preview-ready-heading">Your meme is ready!</h1>

      {/* Token identity card */}
      <div className="preview-box">
        <div className="preview-new-layout">
          <div className="preview-new-logo-col">
            <div className="preview-new-logo-frame">
              {data.dataUrl
                ? <img src={data.dataUrl} alt={data.name} className="preview-new-img" />
                : <div className="preview-new-placeholder">{data.shortName?.[0] ?? '?'}</div>
              }
              <div className="preview-new-logo-shine" />
            </div>
            <div className="preview-new-symbol-badge">${data.shortName}</div>
          </div>

          <div className="preview-new-info-col">
            {editing ? (
              <div className="preview-edit-fields">
                <label className="preview-edit-label">token name</label>
                <input className="preview-edit-input preview-edit-input--lg"
                  value={draft.name} maxLength={NAME_MAX_LENGTH}
                  onChange={e => setDraft({ ...draft, name: e.target.value })} />
                {nameError && <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px', display: 'block' }}><AlertCircle size={14} style={{ display: 'inline-block' }} /> {nameError}</span>}

                <label className="preview-edit-label">symbol</label>
                <input className="preview-edit-input preview-edit-input--mono"
                  value={draft.shortName} maxLength={6}
                  onChange={e => setDraft({ ...draft, shortName: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })} />

                <label className="preview-edit-label">category</label>
                <select className="preview-edit-select"
                  value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })}>
                  {LABELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            ) : (
              <>
                <h2 className="preview-new-name">{data.name}</h2>
                <span className="preview-new-label">{data.label}</span>
              </>
            )}

            <div className="preview-new-divider" style={{ margin: '12px 0' }} />

            <div className="preview-new-field">
              <span className="preview-new-field-label">description</span>
              {editing
                ? <textarea className="preview-edit-textarea" rows={3} maxLength={200}
                  value={draft.desc} onChange={e => setDraft({ ...draft, desc: e.target.value })} />
                : <p className="preview-new-desc">{data.desc}</p>
              }
            </div>

            {(data.tagline || editing) && (
              <div className="preview-new-field" style={{ marginTop: '12px' }}>
                <span className="preview-new-field-label">tagline</span>
                {editing
                  ? <input className="preview-edit-input" value={draft.tagline ?? ''}
                    onChange={e => setDraft({ ...draft, tagline: e.target.value })} />
                  : <p className="preview-new-tagline">"{data.tagline}"</p>
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Origin lore */}
      {data.lore && (
        <div className="preview-box preview-box--lore" style={{ display: 'flex', flexDirection: 'row', gap: '14px' }}>
          <span className="preview-lore-icon"><FileText size={18} /></span>
          <div>
            <span className="preview-lore-label">origin lore</span>
            <p className="preview-lore-text">{data.lore}</p>
          </div>
        </div>
      )}

      {/* Launch tweet preview */}
      {data.tweet && (
        <div className="preview-box preview-box--tweet">
          <div className="tweet-box-header">
            <span>𝕏</span> <span className="preview-lore-label">launch tweet</span>
          </div>
          <p className="preview-tweet-text">{data.tweet}</p>
        </div>
      )}

      {/* AI Viral Score */}
      <ViralScorePanel key={`${data.name}-${data.shortName}`} data={data} />

      {/* Social links (edit mode only) */}
      {editing && (
        <div className="preview-box">
          <span className="preview-new-field-label">twitter / X url (optional)</span>
          <input className="preview-edit-input" placeholder="https://x.com/..."
            value={draft.twitterUrl ?? ''} onChange={e => setDraft({ ...draft, twitterUrl: e.target.value })} />
        </div>
      )}

      {/* Action buttons */}
      <div className="preview-box preview-box--actions">
        <div className="preview-new-actions-left" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {editing ? (
            <>
              <button className="btn-ghost-sm" onClick={cancel}>Cancel</button>
              <button className="btn-outline-sm" onClick={save} disabled={!!nameError}>Save ✓</button>
            </>
          ) : (
            <>
              <button className="btn-ghost-sm" onClick={onReset} title="Start Over">↺ Start Over</button>
              <button className="btn-ghost-sm" onClick={() => setEditing(true)}><Edit2 size={16} style={{ display: 'inline-block' }} /> Edit Details</button>
            </>
          )}
        </div>
        <button
          className="btn-launch"
          onClick={() => onDeploy(data)}
          disabled={editing || !isConnected || !isAuthReady}
          title={!isConnected ? 'Connect wallet first!' : !isAuthReady ? 'Waiting for Four.meme login…' : ''}
        >
          {!isConnected
            ? <><Lock size={16} style={{ display: 'inline-block', verticalAlign: 'bottom' }} /> connect wallet</>
            : !isAuthReady
              ? <><Clock size={16} style={{ display: 'inline-block', verticalAlign: 'bottom' }} /> connecting to four.meme…</>
              : <><Rocket size={16} style={{ display: 'inline-block', verticalAlign: 'bottom' }} /> launch to Fourmeme →</>
          }
        </button>
      </div>

      {/* Connection hints */}
      {!isConnected && (
        <p className="preview-wallet-hint" style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <ArrowUp size={16} style={{ display: 'inline-block', verticalAlign: 'bottom' }} /> Connect your MetaMask wallet to launch this token
        </p>
      )}
      {isConnected && !isAuthReady && (
        <p className="preview-wallet-hint" style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <Key size={16} style={{ display: 'inline-block', verticalAlign: 'bottom' }} /> Signing in to Four.meme — check MetaMask for the login request
        </p>
      )}
    </div>
  )
}
