/**
 * CreateInput.jsx
 *
 * The "idea input" step of the token creation flow.
 * Users type a meme concept and hit Generate. Includes:
 *   - Rotating placeholder ideas for inspiration
 *   - Optional memeStyle input to guide AI visual aesthetic
 *   - Progress bar with phase labels during AI generation
 *   - Quick-pick example chips
 */

import { useState, useEffect } from 'react'
import { Sparkles, Lightbulb, Loader, Palette, Brain } from 'lucide-react'
import { STEPS } from '../hooks/useTokenCreator'
import { useNavigate } from 'react-router-dom'

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

export default function CreateInput({ onGenerate, isGenerating, step, genProgress, initialIdea = '' }) {
  const [idea, setIdea] = useState(initialIdea)
  const [imageStyle, setImageStyle] = useState('')
  const [phIdx, setPhIdx] = useState(0)
  const [localLoading, setLocalLoading] = useState(false)
  const [showStyleInput, setShowStyleInput] = useState(false)
  const navigate = useNavigate()

  const loading = localLoading || isGenerating

  // Rotate placeholder text every 3 seconds
  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % IDEAS.length), 3000)
    return () => clearInterval(t)
  }, [])

  // Sync initialIdea if it changes (e.g. user navigates with new param)
  useEffect(() => {
    if (initialIdea) setIdea(initialIdea)
  }, [initialIdea])

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
              <Loader size={15} className="spin-anim" />
              <span>cooking…</span>
            </div>
          ) : 'Generate'}
        </button>

        {!loading && (
          <button
            onClick={() => navigate('/trend')}
            className="an-search-btn"
            style={{ width: 'auto', padding: '0 20px', height: '44px', borderRadius: '12px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', boxShadow: 'none' }}
          >
            <Sparkles size={14} />
            <span style={{ fontSize: '13px' }}>Trend Discovery</span>
          </button>
        )}
      </div>

      {/* Image style selector */}
      {!loading && (
        <div className="create-style-section">
          <button
            onClick={() => setShowStyleInput(s => !s)}
            className={`create-style-btn ${showStyleInput ? 'create-style-btn--active' : ''}`}
          >
            <Palette size={14} />
            {showStyleInput ? 'hide meme style' : 'set meme style (optional)'}
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


      {/* Brain Radar Loader during generation */}
      {loading ? (
        <div className="an-analyzing" style={{ padding: '40px 0' }}>
          <div className="an-analyzing-orb">
            <div className="an-orb-ring an-orb-ring--1" />
            <div className="an-orb-ring an-orb-ring--2" />
            <div className="an-orb-ring an-orb-ring--3" />
            <Brain size={28} className="an-orb-icon" />
          </div>
          <h3 style={{ marginTop: 30 }}>Cooking your meme…</h3>
          <p>The AI is visualizing your idea and crafting its lore</p>
          <div className="an-analyzing-steps" style={{ alignSelf: 'center', marginTop: 10 }}>
            {PHASE_CONFIG.map((p, i) => {
              const isActive = p.key === step
              // A simple way to show past steps as done
              const currentIndex = PHASE_CONFIG.findIndex(ph => ph.key === step)
              const isPast = i < currentIndex

              return (
                <div key={i} className="an-analyzing-step" style={{ opacity: isActive || isPast ? 1 : 0.4 }}>
                  <Loader size={12} className={isActive ? "spin-anim" : ""} style={{ opacity: isActive ? 0.8 : 0.4 }} />
                  <span style={{ color: isActive ? 'var(--green)' : 'inherit' }}>{p.title}</span>
                </div>
              )
            })}
          </div>
          
          <div className="create-progress-section" style={{ marginTop: 40, opacity: 0.8 }}>
            <div className="create-progress-track" style={{ height: 4 }}>
              <div className="create-progress-fill" style={{ width: `${pct}%` }} />
            </div>
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
