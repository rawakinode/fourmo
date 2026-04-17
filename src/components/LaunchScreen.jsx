/**
 * LaunchScreen.jsx
 *
 * Full-screen deployment progress overlay shown during the on-chain
 * token launch phase. Displays a step-by-step checklist with animated
 * progress bar and contextual MetaMask reminder at the signing step.
 */

import { Image, ClipboardList, PenTool, LinkIcon, CheckCircle2, Zap, Square, AlertTriangle, Wind, Rocket } from 'lucide-react'
import { STEPS, STEP_LABELS } from '../hooks/useTokenCreator'

// Deployment pipeline steps with icons and humorous status messages
const LAUNCH_PHASES = [
  { key: STEPS.UPLOADING, icon: Image, funny: 'uploading meme image…', label: 'upload logo' },
  { key: STEPS.CREATING_API, icon: ClipboardList, funny: 'filling out the meme paperwork…', label: 'register token' },
  { key: STEPS.SIGNING_TX, icon: PenTool, funny: 'signing with the power of your wallet…', label: 'sign tx' },
  { key: STEPS.CONFIRMING, icon: LinkIcon, funny: 'BSC validators reviewing your genius…', label: 'confirming' },
]

export default function LaunchScreen({ step }) {
  const currentIdx = LAUNCH_PHASES.findIndex(p => p.key === step)
  const current = LAUNCH_PHASES[Math.max(0, currentIdx)]
  const pct = currentIdx < 0 ? 5 : Math.round(((currentIdx + 1) / LAUNCH_PHASES.length) * 100)

  return (
    <div className="launch-screen">
      {/* Animated rocket icon */}
      <div className="launch-rocket-wrap" aria-hidden>
        <span className="launch-rocket"><Rocket size={56} color="var(--green)" /></span>
        <div className="launch-exhaust">
          {[0, 1, 2].map((i) => (
            <span key={i} className="exhaust-puff" style={{ animationDelay: `${i * 0.2}s` }}><Wind size={16} /></span>
          ))}
        </div>
      </div>

      <h2 className="launch-title">launching…</h2>
      <p className="launch-funny">{current?.funny}</p>

      {/* Progress bar */}
      <div className="launch-bar-wrap">
        <div className="launch-bar-track">
          <div className="launch-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="launch-bar-pct">{pct}%</span>
      </div>

      {/* Step checklist */}
      <div className="launch-steps">
        {LAUNCH_PHASES.map((p, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          return (
            <div key={p.key} className={`launch-step ${done ? 'done' : active ? 'active' : 'pending'}`}>
              <span className="launch-step-icon">
                {done ? <CheckCircle2 size={18} /> : active ? <span className="spin-fast"><Zap size={18} /></span> : <Square size={18} />}
              </span>
              <span className="launch-step-label">{p.label}</span>
            </div>
          )
        })}
      </div>

      {/* MetaMask prompt — only shown during the signing step */}
      {step === STEPS.SIGNING_TX && (
        <div className="launch-metamask-hint">
          <span><AlertTriangle size={16} /></span>
          <span>check MetaMask — approve the transaction!</span>
        </div>
      )}
    </div>
  )
}
