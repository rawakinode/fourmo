/**
 * SuccessScreen.jsx
 *
 * Post-launch success screen shown after a token is deployed to BSC.
 * Includes confetti animation, token info, external links (Four.meme,
 * BSCScan, Twitter), and a tabbed Marketing Kit panel that generates
 * promotional content via AI (tweets, Telegram messages, hashtags).
 */

import { useEffect, useState } from 'react'
import { Trophy, Gem, Rocket, Sparkles, Send, Search,
         Copy, Check, Megaphone, Link2, MessageSquare, Hash, Loader2 } from 'lucide-react'

// Random congratulatory messages
const CONGRATS = [
  'you absolute legend 🏆',
  'ser, you are built different 💎',
  'ngab, token lu live bro! 🔥',
  'to the moon and beyond 🚀',
  'your meme is now immortal ✨',
]

// Label configs for tweet types
const TWEET_LABELS = {
  hype: { emoji: '🔥', label: 'hype launch' },
  alpha: { emoji: '🧠', label: 'alpha leak' },
  community: { emoji: '🤝', label: 'community' },
  fud_response: { emoji: '🛡', label: 'fud response' },
}

// Label configs for Telegram message types
const TGRAM_LABELS = {
  announcement: { emoji: '📢', label: 'announcement' },
  community: { emoji: '👋', label: 'welcome message' },
}

/** Reusable copy-to-clipboard button with success feedback. */
function CopyBtn({ text, label = 'copy' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text) } catch { return }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className={`mkit-copy-btn ${copied ? 'mkit-copy-btn--done' : ''}`} onClick={copy}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'copied!' : label}
    </button>
  )
}

/**
 * AI Marketing Kit panel.
 * Fetches AI-generated marketing content on mount and displays
 * it in sub-tabs: tweets (with post-to-X links), Telegram messages,
 * and a hashtag cloud.
 */
function MarketingKit({ tokenData, tokenAddress, fourMemeUrl }) {
  const [kit, setKit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sub, setSub] = useState('tweets')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/marketing-kit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tokenData.name, shortName: tokenData.shortName,
            desc: tokenData.desc, lore: tokenData.lore,
            tagline: tokenData.tagline, tokenAddress, fourMemeUrl,
          }),
        })
        if (!res.ok) throw new Error('request failed')
        setKit(await res.json())
      } catch {
        setError('Could not generate kit. Try again.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return (
    <div className="mkit-loading">
      <Loader2 size={20} className="mkit-spin" />
      <span>generating your marketing kit…</span>
    </div>
  )

  if (error) return <p className="mkit-error">{error}</p>

  return (
    <div className="mkit-panel">
      {/* Sub-tab navigation */}
      <div className="mkit-subtabs">
        {[
          { id: 'tweets',   icon: MessageSquare, label: 'tweets' },
          { id: 'telegram', icon: Send,          label: 'telegram' },
          { id: 'hashtags', icon: Hash,          label: 'hashtags' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} className={`mkit-subtab ${sub === id ? 'mkit-subtab--active' : ''}`} onClick={() => setSub(id)}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Tweets */}
      {sub === 'tweets' && (
        <div className="mkit-items">
          {kit?.tweets?.map((item, i) => {
            const meta = TWEET_LABELS[item.type] || { emoji: '✦', label: item.type }
            return (
              <div key={i} className="mkit-item">
                <div className="mkit-item-head">
                  <span className="mkit-badge">{meta.emoji} {meta.label}</span>
                  <CopyBtn text={item.text} />
                </div>
                <p className="mkit-item-text">{item.text}</p>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(item.text)}`}
                  target="_blank" rel="noopener" className="mkit-post-link"
                >
                  post on 𝕏 →
                </a>
              </div>
            )
          })}
        </div>
      )}

      {/* Telegram */}
      {sub === 'telegram' && (
        <div className="mkit-items">
          {kit?.telegram?.map((item, i) => {
            const meta = TGRAM_LABELS[item.type] || { emoji: '💬', label: item.type }
            return (
              <div key={i} className="mkit-item">
                <div className="mkit-item-head">
                  <span className="mkit-badge">{meta.emoji} {meta.label}</span>
                  <CopyBtn text={item.text} />
                </div>
                <p className="mkit-item-text" style={{ whiteSpace: 'pre-line' }}>{item.text}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Hashtags */}
      {sub === 'hashtags' && kit?.hashtags && (
        <div className="mkit-hashtags">
          <div className="mkit-tag-cloud">
            {kit.hashtags.map((tag, i) => (
              <span key={i} className="mkit-tag">#{tag}</span>
            ))}
          </div>
          <CopyBtn text={kit.hashtags.map(t => `#${t}`).join(' ')} label="copy all" />
        </div>
      )}
    </div>
  )
}

/** Main success screen — shown after successful token deployment. */
export default function SuccessScreen({ result, onReset }) {
  const { txHash, fourMemeUrl, bscScanUrl, tokenData, tokenAddress } = result
  const [tab, setTab] = useState('links')

  // Generate confetti particles with randomized positions and timing
  const [confettiItems] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i, icon: [Trophy, Gem, Rocket, Sparkles][i % 4],
      x: Math.random() * 100, delay: Math.random() * 0.8, dur: 1.5 + Math.random() * 1,
    }))
  )

  const tweetText = encodeURIComponent(
    tokenData.tweet ||
    `${tokenData.name} ($${tokenData.shortName}) is LIVE on BSC! 🚀 Just launched via @fourdotmemeZH #BSC #Meme #${tokenData.shortName}`
  )

  return (
    <div className="success-screen">
      {/* Confetti animation */}
      <div className="confetti-wrap" aria-hidden>
        {confettiItems.map(c => {
          const Icon = c.icon
          return (
            <span key={c.id} className="confetti-item" style={{
              left: `${c.x}%`, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s`,
            }}><Icon size={20} /></span>
          )
        })}
      </div>

      {/* Token logo with animated rings */}
      <div className="success-logo-wrap">
        {tokenData.imgUrl
          ? <img src={tokenData.imgUrl} alt={tokenData.name} className="success-logo" />
          : <div className="success-logo-ph">{tokenData.shortName?.[0]}</div>
        }
        <div className="success-logo-ring success-logo-ring--1" />
        <div className="success-logo-ring success-logo-ring--2" />
      </div>

      <div className="success-congrats">{CONGRATS[Math.floor(Math.random() * CONGRATS.length)]}</div>
      <h2 className="success-title"><span className="success-name">{tokenData.name}</span> is LIVE!</h2>
      <p className="success-symbol">${tokenData.shortName} · BSC Mainnet</p>

      {tokenAddress && (
        <div className="success-contract">
          <span className="success-contract-label">contract address</span>
          <code className="success-contract-addr">{tokenAddress}</code>
        </div>
      )}

      {/* Tab bar: Links / Marketing Kit */}
      <div className="success-tabs">
        <button className={`success-tab ${tab === 'links' ? 'success-tab--active' : ''}`} onClick={() => setTab('links')}>
          <Link2 size={13} /> links
        </button>
        <button className={`success-tab ${tab === 'marketing' ? 'success-tab--active' : ''}`} onClick={() => setTab('marketing')}>
          <Megaphone size={13} /> marketing kit
          <span className="success-tab-ai">AI</span>
        </button>
      </div>

      {/* Links tab */}
      {tab === 'links' && (
        <div className="success-actions">
          <a href={fourMemeUrl} target="_blank" rel="noopener" className="success-btn success-btn--primary">
            <Rocket size={16} style={{display:'inline'}} /> open on four.meme
          </a>
          <a href={`https://twitter.com/intent/tweet?text=${tweetText}`}
            target="_blank" rel="noopener" className="success-btn success-btn--tweet">
            <Send size={16} style={{display:'inline'}} /> post launch tweet
          </a>
          <a href={bscScanUrl} target="_blank" rel="noopener" className="success-btn success-btn--ghost">
            <Search size={16} style={{display:'inline'}} /> view tx on BSCScan
          </a>
        </div>
      )}

      {/* Marketing Kit tab */}
      {tab === 'marketing' && (
        <MarketingKit tokenData={tokenData} tokenAddress={tokenAddress} fourMemeUrl={fourMemeUrl} />
      )}

      <div className="success-tx">
        <span>tx:</span>
        <code>{txHash.slice(0,18)}…{txHash.slice(-8)}</code>
      </div>

      <button className="success-another" onClick={onReset}>+ create another token</button>
    </div>
  )
}
