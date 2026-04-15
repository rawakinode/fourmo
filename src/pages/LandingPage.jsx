/**
 * LandingPage.jsx
 *
 * Marketing landing page for the Fourmo platform.
 * Structured in sections: hero, how-it-works, features, tech stack, and CTA.
 * Includes floating logo animations and a scrolling tech stack strip.
 */

import { useState, useEffect } from 'react'
import { MessageCircle, Bot, Rocket, Sparkles, BarChart3, Megaphone, Brain, Blocks, Zap, Network } from 'lucide-react'


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
  { name: 'DGrid Network', icon: Network },
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
]

export default function LandingPage({ onStart }) {
  const [floaters, setFloaters] = useState([])

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
        <div className="hero-live-badge">
          <span className="live-dot" />
          <span>Four.Meme AI Sprint Hackathon</span>
        </div>

        <h1 className="hero-h1">
          Your meme.<br />
          <span className="hero-h1-accent">On-chain.</span><br />
          <span className="hero-h1-sub">In 60 seconds.</span>
        </h1>

        <p className="hero-p">
          Turn any idea into a live token. AI instantly crafts your name, logo, lore, and launch tweet. <br />Connect wallet. Deploy to Four.meme. Zero code. Infinite potential.
        </p>

        <div className="hero-cta-row">
          <button className="btn-hero" onClick={onStart}>
            <span>Start creating</span>
            <span className="btn-hero-arrow">→</span>
          </button>
          <a href="https://four.meme" target="_blank" rel="noopener" className="btn-ghost-lg">
            view on four.meme ↗
          </a>
        </div>

        <div className="hero-stats">
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
      <section className="how-section">
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
      <section className="features-section">
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
      <section className="strip-section">
        <div className="section-label">technology stack</div>
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

      {/* Final CTA */}
      <section className="cta-section">
        <div className="cta-blob" aria-hidden />
        <h2 className="cta-h2">Your meme is waiting.</h2>
        <p className="cta-p">The blockchain doesn't care if it's silly. Launch it anyway.</p>
        <button className="btn-hero btn-hero--lg" onClick={onStart}>
          create my token <span>🐸</span>
        </button>
      </section>
    </div>
  )
}
