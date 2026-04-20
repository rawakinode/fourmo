/**
 * LandingPage.jsx
 *
 * Marketing landing page for the Fourmo platform.
 * Structured in sections: hero, how-it-works, features, built with, and CTA.
 * Includes floating logo animations and a scrolling built with strip.
 */

import { useState, useEffect } from 'react'
import { MessageCircle, Bot, Rocket, Sparkles, BarChart3, Megaphone, Brain, Blocks, Zap, Network, Activity, CheckCircle2, Clock, Telescope, Cpu, Globe, Users } from 'lucide-react'
import useScrollReveal from '../hooks/useScrollReveal'


// Decorative floating logo images
const FLOATERS = ['/logo_250.png', '/logo_250.png', '/logo_250.png', '/logo_250.png', '/logo_250.png', '/logo_250.png', '/logo_250.png', '/logo_250.png', '/logo_250.png', '/logo_250.png', '/logo_250.png', '/logo_250.png']

// 3-step walkthrough for "How it works"
const HOW_STEPS = [
  { num: '01', icon: MessageCircle, title: 'Describe your meme', body: 'Type literally anything. The weirder the better. Our AI has zero judgment.' },
  { num: '02', icon: Bot, title: 'AI does the work', body: 'Name, symbol, logo, lore, launch tweet — generated in seconds. Edit anything you want.' },
  { num: '03', icon: Rocket, title: 'One click launch', body: 'Connect MetaMask, approve two popups, and your token is live on BSC. That\'s it.' },
]

// Technology stack highlights
const TECH_STACK = [
  { name: 'Binance Smart Chain', icon: Blocks },
  { name: 'AI', icon: Brain },
  { name: 'Four.Meme', icon: Rocket },
  { name: 'Fireworks AI', icon: Zap },
  { name: 'Dgrid AI', icon: Brain },
]

// Platform feature cards
const AI_FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Generate Meme',
    body: 'Create a complete meme coin concept in seconds: name, ticker, logo, and project narrative.',
  },
  {
    icon: BarChart3,
    title: 'AI Score Analysis',
    body: 'Analyze meme idea quality with scoring that helps estimate engagement and virality potential.',
  },
  {
    icon: Megaphone,
    title: 'AI Marketing Kit',
    body: 'Generate launch tweets, token descriptions, and promotional copy ready for campaign use.',
  },
  {
    icon: Brain,
    title: 'AI Token Analysis',
    body: 'Deep analysis of token health, evaluating holder metrics and DEX market data for comprehensive insights.',
  },
  {
    icon: Rocket,
    title: 'Meme Launcher',
    body: 'One-click deployment to Four.meme on Binance Smart Chain. Low fees, instant liquidity, and zero code required.',
  },
  {
    icon: Activity,
    title: 'AI Trend Discovery',
    body: 'Real-time multi-chain market analysis powered by AI to identify the next viral meme trends before they peak.',
  },
]

// Roadmap phases
const ROADMAP = [
  {
    phase: '01',
    label: 'Shipped',
    badge: 'Live Now',
    accent: 'green',
    items: [
      { icon: Cpu, text: '7-stage AI creation pipeline with incremental UI' },
      { icon: Brain, text: 'DGrid Gemini 3 Pro image integration' },
      { icon: Sparkles, text: 'Image Style selection with 6+ visual presets' },
      { icon: BarChart3, text: 'DexScreener + Four.meme hybrid token analysis' },
      { icon: Activity, text: 'AI Trend Discovery with multi-source data fusion' },
      { icon: Megaphone, text: 'Full marketing kit: tweets, Telegram, hashtags' },
    ],
  },
  {
    phase: '02',
    label: 'Next Up',
    badge: 'In Progress',
    accent: 'yellow',
    items: [
      { icon: Bot, text: 'AI Agent Mode: autonomous token monitoring & price alerts' },
      { icon: Zap, text: 'Batch Scoring: analyze entire trending lists in one click' },
    ],
  },
  {
    phase: '03',
    label: 'Vision',
    badge: 'Future',
    accent: 'purple',
    items: [
      { icon: Globe, text: 'Multi-chain expansion: Solana & Base' },
      { icon: Users, text: 'Social graph: auto-post marketing kit to X/Telegram' },
    ],
  },
]

export default function LandingPage({ onStart }) {
  const [floaters, setFloaters] = useState([])
  useScrollReveal()

  // Spawn floating logos with randomized positions and animation timing
  useEffect(() => {
    const spawned = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: FLOATERS[i % FLOATERS.length],
      x: 5 + Math.random() * 90,
      y: 10 + Math.random() * 80,
      delay: i * 0.4,
      dur: 4 + Math.random() * 4,
      size: 18 + Math.random() * 22,
    }))
    setFloaters(spawned)
  }, [])

  return (
    <div className="landing">
      {/* Floating logos background */}
      <div className="landing-floaters" aria-hidden>
        {floaters.map(f => (
          <img key={f.id} src={f.emoji} alt="" className="floater" style={{
            left: `${f.x}%`, top: `${f.y}%`,
            animationDuration: `${f.dur}s`,
            animationDelay: `${f.delay}s`,
            width: `${f.size}px`,
            height: `${f.size}px`,
          }} />
        ))}
      </div>

      {/* Hero section */}
      <section className="hero">
        <div className="hero-live-badge reveal">
          <span className="live-dot" />
          <span>Four.Meme AI Sprint Hackathon</span>
        </div>

        <h1 className="hero-h1 reveal reveal-delay-1">
          Your meme.<br />
          <span className="hero-h1-accent">On-chain.</span><br />
          <span className="hero-h1-sub">In 60 seconds.</span>
        </h1>

        <p className="hero-p reveal reveal-delay-2">
          Turn any idea into a live token. AI instantly crafts your name, logo, lore, and launch tweet. <br />Connect wallet. Deploy to Four.meme. Zero code. Infinite potential.
        </p>

        <div className="hero-cta-row reveal reveal-delay-3">
          <button className="btn-hero" onClick={onStart}>
            <span>Start creating</span>
            <span className="btn-hero-arrow">→</span>
          </button>
          <a href="https://four.meme" target="_blank" rel="noopener" className="btn-ghost-lg">
            view on four.meme ↗
          </a>
        </div>

        <div className="hero-stats reveal reveal-delay-4">
          {[
            { v: '60s', l: 'idea → live' },
            { v: 'BSC', l: 'BNB Chain' },
            { v: 'AI', l: 'does the hard part' },
            { v: 'free', l: 'to generate' },
          ].map(s => (
            <div className="hero-stat" key={s.l}>
              <span className="hero-stat-v">{s.v}</span>
              <span className="hero-stat-l">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — 3-step walkthrough */}
      <section className="how-section reveal">
        <div className="section-label">how it works</div>
        <div className="how-grid">
          {HOW_STEPS.map((s, i) => {
            const IconComponent = s.icon
            return (
              <div className="how-card" key={i}>
                <div className="how-num">{s.num}</div>
                <div className="how-emoji"><IconComponent size={40} strokeWidth={1.5} /></div>
                <h3 className="how-title">{s.title}</h3>
                <p className="how-body">{s.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features grid */}
      <section className="features-section reveal">
        <div className="section-label">features</div>
        <div className="features-grid">
          {AI_FEATURES.map((feature) => {
            const IconComponent = feature.icon
            return (
              <div className="feature-card" key={feature.title}>
                <div className="feature-icon">
                  <IconComponent size={22} strokeWidth={1.8} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-body">{feature.body}</p>
              </div>
            )
          })}
        </div>
      </section>


      {/* Technology stack — scrolling strip */}
      <section className="strip-section reveal">
        <div className="section-label">Built with</div>
        <div className="strip-row">
          {[...TECH_STACK, ...TECH_STACK, ...TECH_STACK, ...TECH_STACK].map((tech, idx) => {
            const IconComponent = tech.icon;
            return (
              <div className="strip-chip" key={`${tech.name}-${idx}`}>
                <div className="strip-chip-icon"><IconComponent size={18} strokeWidth={2.5} /></div>
                <span>{tech.name}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Roadmap */}
      <section className="roadmap-section reveal">
        <div className="section-label">roadmap</div>
        <div className="roadmap-header">
          <h2 className="roadmap-title">Built today. Evolving tomorrow.</h2>
          <p className="roadmap-subtitle">From a 7-stage AI pipeline to autonomous agents — here's where Fourmo is headed.</p>
        </div>
        <div className="roadmap-grid">
          {ROADMAP.map((phase, pi) => (
            <div className={`roadmap-phase roadmap-phase--${phase.accent}`} key={pi}>
              <div className="roadmap-phase-header">
                <span className="roadmap-phase-num">{phase.phase}</span>
                <div className="roadmap-phase-meta">
                  <span className="roadmap-phase-label">{phase.label}</span>
                  <span className={`roadmap-badge roadmap-badge--${phase.accent}`}>{phase.badge}</span>
                </div>
              </div>
              <div className="roadmap-items">
                {phase.items.map((item, ii) => {
                  const Icon = item.icon
                  return (
                    <div className="roadmap-item" key={ii}>
                      <div className={`roadmap-item-icon roadmap-item-icon--${phase.accent}`}>
                        <Icon size={14} strokeWidth={2} />
                      </div>
                      <span className="roadmap-item-text">{item.text}</span>
                    </div>
                  )
                })}
              </div>
              <div className="roadmap-phase-glow" aria-hidden />
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section reveal">
        <div className="cta-box">
          <div className="cta-box-glow" aria-hidden />
          <h2 className="cta-h2">Your meme is waiting.</h2>
          <p className="cta-p">The blockchain doesn't care if it's silly.<br />Launch it anyway and join the meta.</p>
          <button className="btn-hero btn-hero--lg btn-premium" onClick={onStart}>
             <span>Create my token</span> <Rocket size={20} strokeWidth={2.5} />
          </button>
        </div>
      </section>
    </div>
  )
}
