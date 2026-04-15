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
        <div className="create-style-section">
          <button
            onClick={() => setShowStyleInput(s => !s)}
            className={`create-style-btn ${showStyleInput ? 'create-style-btn--active' : ''}`}
          >
            <Palette size={14} />
            {showStyleInput ? 'hide image style' : 'set image style (optional)'}
          </button>

          {showStyleInput && (
            <div className="create-style-content">
              <input
                type="text"
                value={imageStyle}
                onChange={e => setImageStyle(e.target.value)}
                placeholder="e.g. anime chibi mascot, pixel art 8-bit, glitch cyberpunk…"
                maxLength={100}
                className="create-style-field"
              />
              <div className="create-style-presets">
                {STYLE_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setImageStyle(preset)}
                    className={`create-preset-btn ${imageStyle === preset ? 'create-preset-btn--active' : ''}`}
                  >
                    {preset}
                  </button>
                ))}
                {imageStyle && (
                  <button
                    onClick={() => setImageStyle('')}
                    className="create-style-clear"
                  >
                    ✕ clear
                  </button>
                )}
              </div>
              <p className="create-style-help">
                leave empty to let AI choose the best style automatically
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress bar during generation */}
      {loading ? (
        <div className="create-progress-section">
          <div className="create-progress-header">
            <span>{(PHASE_CONFIG.find(p => p.key === step) ?? PHASE_CONFIG[0]).title}...</span>
            <span>{pct}%</span>
          </div>
          <div className="create-progress-track">
            <div className="create-progress-fill" style={{ width: `${pct}%` }} />
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
