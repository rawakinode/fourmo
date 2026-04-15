/**
 * CreateInput.jsx
 *
 * The "idea input" step of the token creation flow.
 * Users type a meme concept and hit Generate. Includes:
 *   - Rotating placeholder ideas for inspiration
 *   - Optional imageStyle input to guide AI visual aesthetic
 *   - Progress bar with phase labels during AI generation
 *   - Quick-pick example chips
 */

import { useState, useEffect } from 'react'
import { Sparkles, Lightbulb, RotateCw, Palette } from 'lucide-react'

import { STEPS } from '../hooks/useTokenCreator'

// Rotating placeholder ideas shown in the input field
const IDEAS = [
  'a cat that became a crypto billionaire',
  'a blockchain version of your favorite dish',
  'a ride-hailing app that turned into a BSC whale',
  'a chill capybara shilling during bear market',
  'a food-themed token for hungry traders',
  'a duck smarter than wall street',
  'grandma becomes a master trader',
  'a bus route coin with stuck traffic charts',
]

// Preset style options for quick selection
const STYLE_PRESETS = [
  'bold flat vector',
  'anime chibi mascot',
  'pixel art 8-bit',
  'hyper-realistic 3D',
  'glitch cyberpunk',
  'watercolor sketch',
]

// Maps generation steps to progress bar labels
const PHASE_CONFIG = [
  { key: STEPS.GENERATING, title: 'Creating meme details' },
  { key: STEPS.GEN_LORE, title: 'Creating meme lore' },
  { key: STEPS.GEN_IMAGE, title: 'Creating meme image' },
  { key: STEPS.GEN_SCORE, title: 'Creating AI viral score' },
]

export default function CreateInput({ onGenerate, isGenerating, step, genProgress }) {
  const [idea, setIdea] = useState('')
  const [imageStyle, setImageStyle] = useState('')
  const [phIdx, setPhIdx] = useState(0)
  const [localLoading, setLocalLoading] = useState(false)
  const [showStyleInput, setShowStyleInput] = useState(false)

  const loading = localLoading || isGenerating

  // Rotate placeholder text every 3 seconds
  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % IDEAS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const handleGo = async () => {
    if (!idea.trim() || loading) return
    setLocalLoading(true)
    try { await onGenerate(idea.trim(), imageStyle.trim() || undefined) }
    finally { setLocalLoading(false) }
  }

  // Progress percentage mapped to each generation phase
  const getPct = () => {
    if (step === STEPS.GENERATING) return 25
    if (step === STEPS.GEN_LORE) return 50
    if (step === STEPS.GEN_IMAGE) return 75
    if (step === STEPS.GEN_SCORE) return 90
    return 10
  }
  const pct = getPct()

  return (
    <div className="create-input-page">
      <div className="create-input-header">
        <h2 className="create-input-h2">
          what's your meme? <span className="sparkle"><Sparkles size={20} style={{ display: 'inline' }} /></span>
        </h2>
        <p className="create-input-sub">
          Be dumb. Be bold. Be yourself. AI handles the rest.
        </p>
      </div>

      <div className="create-input-box">
        <div className="create-input-wrap">
          <span className="create-prompt-emoji"><Lightbulb size={20} /></span>
          <input
            className="create-input-field"
            type="text"
            placeholder={IDEAS[phIdx]}
            value={idea}
            onChange={e => setIdea(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGo()}
            maxLength={200}
            disabled={loading}
            autoFocus
          />
        </div>
        <button
          className="create-go-btn"
          onClick={handleGo}
          disabled={!idea.trim() || loading}
        >
          {loading ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCw size={16} style={{ animation: 'spin-anim 1s linear infinite' }} />
              <span>cooking…</span>
            </div>
          ) : 'Generate'}
        </button>
      </div>

      {/* Image style selector */}
      {!loading && (
        <div style={{ width: '100%', maxWidth: '600px', alignSelf: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setShowStyleInput(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: showStyleInput ? 'var(--green)' : 'var(--text2)',
              fontSize: '13px', fontFamily: 'var(--font-mono)', padding: '0',
              transition: 'color 0.2s',
            }}
          >
            <Palette size={14} />
            {showStyleInput ? 'hide image style' : 'set image style (optional)'}
          </button>

          {showStyleInput && (
            <div style={{ marginTop: '10px' }}>
              <input
                type="text"
                value={imageStyle}
                onChange={e => setImageStyle(e.target.value)}
                placeholder="e.g. anime chibi mascot, pixel art 8-bit, glitch cyberpunk…"
                maxLength={100}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '10px 14px',
                  color: 'var(--text1)', fontSize: '14px',
                  fontFamily: 'var(--font-mono)', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--green)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {STYLE_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setImageStyle(preset)}
                    style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                      fontFamily: 'var(--font-mono)', cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: imageStyle === preset ? 'var(--green)' : 'var(--surface2)',
                      color: imageStyle === preset ? 'var(--bg)' : 'var(--text2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {preset}
                  </button>
                ))}
                {imageStyle && (
                  <button
                    onClick={() => setImageStyle('')}
                    style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                      fontFamily: 'var(--font-mono)', cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: 'var(--surface2)', color: 'var(--text2)',
                    }}
                  >
                    ✕ clear
                  </button>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                leave empty to let AI choose the best style automatically
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress bar during generation */}
      {loading ? (
        <div style={{ marginTop: '24px', width: '100%', maxWidth: '600px', alignSelf: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
            <span>{(PHASE_CONFIG.find(p => p.key === step) ?? PHASE_CONFIG[0]).title}...</span>
            <span>{pct}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
        </div>
      ) : (
        /* Example idea chips for quick selection */
        <div className="create-examples">
          <span className="create-examples-label">try these:</span>
          <div className="create-examples-chips">
            {IDEAS.slice(0, 4).map((idea, i) => (
              <button
                key={i}
                className="example-chip"
                onClick={() => setIdea(idea)}
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
