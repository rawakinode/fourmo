# 🐸 Fourmo — AI-Powered Meme Token Studio

> **One idea. One click. One live token.**
> An end-to-end AI platform that generates, scores, launches, and analyzes meme tokens on BSC — powered by **Four.meme**, **Fireworks AI**, and **DGrid Network**.

---

## 📋 Executive Summary

Fourmo is an AI-powered meme token creation and analysis studio built on BNB Smart Chain. Users type a single idea — *"a frog that trades crypto in its sleep"* — and the platform's multi-stage AI pipeline instantly generates a complete token: name, ticker symbol, logo, lore, launch tweet, and marketing kit. One wallet signature later, the token is live on [Four.meme](https://four.meme).

But Fourmo goes beyond creation. It provides **AI Token Analysis** — a deep health-check engine that fetches real-time on-chain data from Four.meme and DexScreener, then runs it through an LLM to produce a comprehensive health report: momentum, community, curve progress, virality scores, alerts, and actionable recommendations.

The platform uses a **dual AI provider architecture**: [Fireworks AI](https://fireworks.ai) for high-speed image generation (FLUX.1) and [DGrid Network](https://dgrid.ai) for decentralized LLM inference — both configurable and swappable via environment variables. This is the intersection of **AI × Meme × Web3**.

---

## 🏆 Hackathon Tracks

**Four.Meme AI Sprint** — DoraHacks

- Track : **AI Creator Tools**
- Bounty : **DGRID**



## 🤖 How AI Powers Fourmo

This section directly addresses the hackathon's primary judging criterion: **AI innovation in Web3 & Meme**.

Fourmo runs **six distinct AI endpoints**, each solving a different part of the meme token lifecycle:

### 1. AI Token Generator — `/api/generate-token`
```
Input  : User idea (free text, any language)
AI     : LLM (DGrid / Fireworks) with crypto-native system prompt
Output : { name, shortName, desc, label, imagePrompt, tagline }
```
The LLM acts as a **meme token creative director** — it understands crypto culture, Four.meme conventions, and viral naming patterns. It translates any idea (even non-English) into a complete token concept with optimal ticker length (3–6 chars), category labels, and a detailed image generation prompt.

### 2. AI Logo Generator — `/api/generate-image`
```
Input  : imagePrompt + token name/symbol
Output : { imageBase64, dataUrl } — ready for on-chain upload
```
Generates a professional crypto token logo with bold flat design, vibrant colors, and centered mascot character. The prompt is enhanced with style directives for consistency across all generated tokens.

### 3. AI Lore Writer — `/api/generate-lore`
```
Input  : Token concept (name, symbol, description, tagline)
AI     : LLM with crypto Twitter copywriter persona
Output : { tweet, lore, useCase }
```
Creates the cultural content that makes meme tokens go viral: a launch tweet (280 chars, hashtags included), an absurd origin story, and a tongue-in-cheek "utility" statement.

### 4. AI Meme Scorer — `/api/score-token`
```
Input  : Token concept + real-time Four.meme trending data
AI     : LLM with crypto meme analyst persona
Output : { overall, catchiness, relatability, memePotential, marketTiming, verdict, tips[] }
```
Scores the token concept across four dimensions (0–100 each) before launch. **Market timing** uses live data from Four.meme's trending tokens to evaluate fit with current trends. Returns a verdict and 3 concrete improvement tips.

### 5. AI Marketing Kit — `/api/marketing-kit`
```
Input  : Token concept + contract address + Four.meme URL
AI     : LLM with crypto marketing expert persona
Output : { tweets[4], telegram[2], hashtags[8] }
```
Generates a complete launch marketing package: 4 tweet types (hype, alpha, community, FUD response), 2 Telegram messages (announcement + welcome), and 8 curated hashtags for BSC meme culture.

### 6. AI Token Health Analysis — `/api/analyze-token`
```
Input  : Token address + on-chain data (Four.meme API + DexScreener API)
AI     : LLM as senior crypto analyst with data-driven system prompt
Output : { headline, sentiment, overall, dimensions{4}, phase, alerts[],
           strengths[], weaknesses[], recommendation, summary, metrics }
```
The most sophisticated AI feature. It:
- Fetches live token data from Four.meme (bonding curve, holders, price, volume)
- Fetches DEX data from DexScreener (liquidity, buy/sell ratio, price changes)
- Detects if token is Four.meme native vs external (different holder logic)
- Feeds everything into an LLM with scoring rules for 4 dimensions:
  - **Momentum** (30%): price × volume relative to market cap
  - **Community** (25%): holder count or transaction-based proxy
  - **Curve** (25%): bonding curve progress toward graduation
  - **Virality** (20%): volume/cap ratio and price action
- Returns actionable recommendations: HOLD, PROMOTE, WATCH, GRADUATED, or STALE

---

### Complete AI Pipeline Flow
```
User types idea
        │
        ▼
┌─────────────────────────────────────────┐
│  1. AI Generate Token                   │
│     LLM → name, ticker, desc, tagline   │
│     DGrid (Claude) / Fireworks (Kimi)   │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │  2. AI Logo │
        │  FLUX.1 or  │
        │  DALL-E 3   │
        └──────┬──────┘
               │
        ┌──────▼────────────────────────────┐
        │  3. AI Lore & Launch Tweet        │
        │     LLM → tweet, lore, useCase   │
        └──────┬────────────────────────────┘
               │
        ┌──────▼────────────────────────────┐
        │  4. AI Score (optional)           │
        │     + live Four.meme HOT data     │
        │     → 4-dimension score 0–100     │
        └──────┬────────────────────────────┘
               │
        ▼  User reviews & edits preview
               │
        ┌──────▼────────────────────────────┐
        │  Connect MetaMask → Sign Tx       │
        │  Upload image to Four.meme CDN    │
        │  Register token via Four.meme API │
        │  Submit createToken() on BSC      │
        └──────┬────────────────────────────┘
               │
        ▼  Token is LIVE on BSC 🚀
               │
        ┌──────▼────────────────────────────┐
        │  5. AI Marketing Kit              │
        │     4 tweets + 2 TG messages      │
        │     + 8 hashtags                  │
        └──────────────────────────────────┘
               │
        ┌──────▼────────────────────────────┐
        │  6. AI Token Analysis             │
        │     Four.meme + DexScreener data  │
        │     → health report + AI advice   │
        └──────────────────────────────────┘
```

---

## 🔗 DGrid Integration

Fourmo uses **DGrid AI** as a decentralized AI inference provider — a key differentiator from centralized-only solutions.

### Why DGrid?

| Feature | Centralized AI | DGrid AI |
|---------|---------------|----------|
| Infrastructure | Single provider | Decentralized smart network |
| Censorship resistance | ❌ Provider can restrict | ✅ Sovereign agentic rails |
| Model flexibility | Vendor lock-in | Multiple models via gateway |
| Web3 alignment | None | Hardware-anchored backbone |

### How It's Used

```
server/.env
├── AI_LLM_PROVIDER=dgrid          ← LLM calls route through DGrid
├── AI_IMAGE_PROVIDER=fireworks    ← Image gen via Fireworks (FLUX.1)
├── DGRID_API_KEY=sk-...
├── DGRID_LLM_MODEL=anthropic/claude-haiku-4.5
└── DGRID_IMAGE_MODEL=google/gemini-3-pro-image-preview
```

The backend uses a **provider abstraction layer** — all 6 AI endpoints use the same `chat()` function, which dynamically routes to either DGrid or Fireworks based on the configured provider:

```javascript
// Dual-provider routing (server/index.js)
async function chat(systemPrompt, userPrompt, maxTokens) {
  const payload = {
    model: LLM_MODEL,  // DGrid: claude-haiku-4.5 | Fireworks: kimi-k2
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
  }

  if (AI_LLM_PROVIDER === 'dgrid') {
    return dgridApi.post('/chat/completions', payload)  // → DGrid Network
  } else {
    return fireworksLlm.post('/chat/completions', payload)  // → Fireworks AI
  }
}
```

Both providers use the **OpenAI-compatible API standard**, making the switch seamless. LLM and Image providers can be configured **independently** — e.g., DGrid for text, Fireworks for images.

---

## 🌐 Four.meme Integration

Fourmo is deeply integrated with the **Four.meme** platform and its BSC smart contracts:

### Smart Contract Interaction
```
Four.meme TokenManager2: 0x5c952063c7fc8610FFDB798152D69F0B9550762b
Four.meme Helper3:       0xF251F83e40a78868FcfA3FA4599Dad6494E46034
```

### Token Lifecycle on Four.meme
```
1. Upload logo     → POST /private/token/upload (CDN)
2. Get config      → GET  /public/config (bonding curve params)
3. Register token  → POST /private/token/create → { createArg, signature }
4. Sign & deploy   → TokenManager2.createToken(createArg, signature) + launchFee
5. Token is live   → Bonding curve active on Four.meme
6. Track progress  → GET /private/token/get/v2?address=0x...
7. Analyze health  → AI analysis with live data from Four.meme + DexScreener
```

### Data Sources for AI Analysis
| Source | Data | Purpose |
|--------|------|---------|
| Four.meme API | Holders, bonding curve, volume, price | Core token metrics |
| DexScreener API | Liquidity, buy/sell ratio, DEX price | Graduated token enrichment |
| Four.meme HOT | Trending tokens | Market timing score context |

---

## 🎯 Features

### For Creators
| Feature | Description |
|---------|-------------|
| 🧠 AI Token Generator | One-sentence idea → complete token concept |
| 🎨 AI Logo Generator | Professional crypto logo via FLUX.1 / DALL-E 3 |
| 📖 AI Lore Writer | Absurd origin story + launch tweet |
| 📊 AI Meme Scorer | 4-dimension scoring with market timing |
| 📢 AI Marketing Kit | 4 tweet types + TG messages + hashtags |
| 🚀 One-Click Deploy | MetaMask → Four.meme → BSC in 60 seconds |

### For Analyzers
| Feature | Description |
|---------|-------------|
| 🔬 AI Token Analysis | Deep health report with 4-dimension scoring |
| 📈 Live Metrics | Real-time data from Four.meme + DexScreener |
| 🎯 Smart Recommendations | AI-driven action: HOLD / PROMOTE / WATCH / STALE |
| ⚡ Hot Token Discovery | Trending tokens with one-click analysis |
| 📋 My Tokens Dashboard | View, search, and analyze all your created tokens |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                      │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ LandingPage │  │  CreatePage  │  │ MyTokens   │  │ Analysis   │ │
│  │             │  │              │  │            │  │ Page       │ │
│  │ • Hero      │  │ • Idea input │  │ • Token    │  │ • Search   │ │
│  │ • Features  │  │ • AI preview │  │   list     │  │ • Health   │ │
│  │ • Tech      │  │ • Edit/tweak │  │ • Search   │  │   report   │ │
│  │ • CTA       │  │ • Deploy     │  │ • Analyze  │  │ • Metrics  │ │
│  └─────────────┘  └──────────────┘  └────────────┘  └────────────┘ │
│                                                                      │
│  lib/fourmeme.js    lib/apiClient.js    lib/contracts.js            │
│  hooks/useFourMemeAuth.js    hooks/useTokenCreator.js               │
│                                                                      │
│  wagmi + RainbowKit  (BSC wallet connection)                        │
└──────────────────────────────┬───────────────────────────────────────┘
                               │  HTTP API
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    AI Provider Router                         │    │
│  │                                                              │    │
│  │  ┌─────────────────┐        ┌──────────────────────────┐    │    │
│  │  │   DGrid AI      │        │    Fireworks AI           │    │    │
│  │  │  (Decentralized) │        │   (High-Speed)           │    │    │
│  │  │                 │        │                          │    │    │
│  │  │ • Claude Haiku  │        │ • Kimi K2               │    │    │
│  │  │   4.5 (LLM)    │        │   (LLM)                 │    │    │
│  │  │ • Gemini 3 Pro  │        │ • FLUX.1 dev FP8        │    │    │
│  │  │   (Image)       │        │   (Image)               │    │    │
│  │  └─────────────────┘        └──────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  6 AI Endpoints:                                                    │
│  POST /api/generate-token     → AI concept generation               │
│  POST /api/generate-image     → AI logo generation                  │
│  POST /api/generate-lore      → AI lore & tweet                    │
│  POST /api/score-token        → AI scoring (+ live market data)     │
│  POST /api/marketing-kit      → AI marketing content               │
│  POST /api/analyze-token      → AI health analysis                  │
│                                                                      │
│  Proxy:                                                             │
│  ALL  /api/four-meme/*        → Four.meme API (CORS bypass)        │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
   ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
   │  Four.meme   │  │   BSC       │  │ DexScreener  │
   │  API + CDN   │  │   Mainnet   │  │  API (free)  │
   │              │  │             │  │              │
   │ • Token CRUD │  │ • Token     │  │ • Liquidity  │
   │ • Upload img │  │   Manager2  │  │ • Volume     │
   │ • Hot tokens │  │ • Helper3   │  │ • Price      │
   │ • Holders    │  │ • Launch    │  │ • Txn count  │
   └──────────────┘  └─────────────┘  └──────────────┘
```

---

## 📁 Project Structure

```
fourmo/
├── README.md
├── .env.example
├── package.json                 # React + Vite + wagmi + RainbowKit
├── vite.config.js               # Dev proxy for Four.meme API
├── index.html
│
├── server/
│   ├── index.js                 # Express backend — 6 AI endpoints + proxy
│   ├── .env                     # API keys (Fireworks + DGrid)
│   └── package.json
│
├── src/
│   ├── main.jsx                 # Wagmi + RainbowKit providers
│   ├── App.jsx                  # Router + layout + footer
│   ├── index.css                # Full design system (95KB)
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx      # Hero, features, tech stack, CTA
│   │   ├── CreatePage.jsx       # AI-powered token creation flow
│   │   ├── MyTokensPage.jsx     # Dashboard with search & pagination
│   │   └── AnalysisPage.jsx     # AI token health analysis
│   │
│   ├── components/
│   │   ├── Header.jsx           # Navigation + wallet connect
│   │   ├── AuthBanner.jsx       # Four.meme auth status
│   │   ├── CreateInput.jsx      # Idea input with progress
│   │   ├── TokenPreviewNew.jsx  # Generated token preview & edit
│   │   ├── LaunchScreen.jsx     # Deployment progress animation
│   │   └── SuccessScreen.jsx    # Post-deploy success + marketing kit
│   │
│   ├── hooks/
│   │   ├── useFourMemeAuth.js   # Four.meme wallet authentication
│   │   └── useTokenCreator.js   # Multi-step AI generation + deploy
│   │
│   └── lib/
│       ├── apiClient.js         # Express backend API client
│       ├── contracts.js         # BSC contract ABIs + addresses
│       └── fourmeme.js          # Four.meme API wrapper (auth, CRUD, search)
│
└── public/
    └── logo_250.png             # App logo
```

---

## ✅ Why This Matters

### ✅ AI Innovation
- **Six specialized AI endpoints** — each with a distinct persona and task-specific prompt engineering
- **Dual-provider architecture** — DGrid (decentralized) + Fireworks (speed), independently configurable
- **Context-aware scoring** — AI Meme Scorer pulls real-time trending data from Four.meme to evaluate market timing
- **Multi-source analysis** — AI Token Analysis fuses data from Four.meme API, DexScreener, and on-chain contracts for comprehensive health reports
- **Adaptive logic** — analysis engine detects Four.meme native tokens vs external (graduated) tokens and adjusts scoring methodology automatically

### ✅ Four.meme Integration
- Full token lifecycle: create → upload → register → deploy → track → analyze
- Live integration with Four.meme's bonding curve, holder data, and public APIs
- Direct smart contract interaction via `TokenManager2.createToken()` on BSC
- Four.meme CDN integration for token logo hosting
- CORS-bypassing proxy for seamless frontend-to-API communication

### ✅ DGrid Integration
- DGrid AI as the primary LLM inference provider for all 6 AI endpoints
- OpenAI-compatible API standard for seamless provider switching
- Independent LLM/Image provider configuration — mix-and-match providers
- Decentralized AI backbone aligned with Web3 philosophy

### ✅ Real-Time UX
- Token generation completes in under 30 seconds (concept + logo + lore)
- Live progress indicators for each AI generation step
- One-click deployment with MetaMask wallet integration
- Real-time token analysis with animated loading states
- Hot token quick-picks for instant analysis
- Responsive design optimized for desktop and mobile

### ✅ Potential Impact
- **Lowers the barrier** to meme token creation from hours to 60 seconds
- **AI-driven quality control** via scoring before launch — reduces low-effort spam
- **Post-launch intelligence** — creators get actionable AI analysis on their tokens' health
- **Decentralized AI infrastructure** — DGrid integration proves Web3 AI is production-ready
- **Template for AI × Web3** — the dual-provider pattern is reusable for any AI-powered dApp

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MetaMask wallet with BNB on BSC Mainnet
- API key for [Fireworks AI](https://app.fireworks.ai/account/api-keys) and/or [DGrid AI](https://dgrid.ai)

### Setup

```bash
# Clone the repository
git clone https://github.com/rawakinode/fourmo.git
cd fourmo

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Configure Environment

```bash
# Backend — AI providers
cp server/.env.example server/.env
# Edit server/.env:
#   FIREWORKS_API_KEY=fw_...
#   DGRID_API_KEY=sk-...
#   AI_LLM_PROVIDER=dgrid         (or fireworks)
#   AI_IMAGE_PROVIDER=fireworks    (or dgrid)

# Frontend (optional)
cp .env.example .env
# Edit .env:
#   VITE_WALLETCONNECT_PROJECT_ID=...
```

### Run Locally

```bash
# Terminal 1 — Frontend (Vite dev server)
npm run dev
# → http://localhost:5173

# Terminal 2 — Backend (Express AI server)
cd server
npm run dev
# → http://localhost:3001

# Or run both together:
npm start
```

### Provider Configuration

| Variable | Options | Default |
|----------|---------|---------|
| `AI_LLM_PROVIDER` | `fireworks`, `dgrid` | `fireworks` |
| `AI_IMAGE_PROVIDER` | `fireworks`, `dgrid` | `fireworks` |
| `FIREWORKS_LLM_MODEL` | Any Fireworks model ID | `kimi-k2-instruct-0905` |
| `FIREWORKS_IMAGE_MODEL` | Any Fireworks image model | `flux-1-dev-fp8` |
| `DGRID_LLM_MODEL` | Any DGrid-supported model | `anthropic/claude-haiku-4.5` |
| `DGRID_IMAGE_MODEL` | Any DGrid image model | `google/gemini-3-pro-image-preview` |

---

## 🗺️ Roadmap

| Phase | Feature |
|-------|---------|
| ✅ Done | AI token generation pipeline (concept + logo + lore) |
| ✅ Done | One-click Four.meme deployment on BSC |
| ✅ Done | AI Meme Scorer with live market context |
| ✅ Done | AI Marketing Kit (tweets + TG + hashtags) |
| ✅ Done | AI Token Health Analysis (multi-source data) |
| ✅ Done | DGrid AI integration as decentralized LLM |
| ✅ Done | My Tokens dashboard with search & pagination |
| 🔜 Next | AI Agent mode — autonomous token monitoring & alerts |
| 🔜 Next | Batch analysis — score multiple tokens simultaneously |
| 🔜 Next | Community analytics — track holder growth over time |
| 🔮 Future | AI-powered trading signals based on analysis trends |
| 🔮 Future | DAO governance for AI model selection & prompt tuning |
| 🔮 Future | Multi-chain expansion (Base, Solana, opBNB) |

---

## 🔒 Security Considerations

- **API keys are server-side only** — Fireworks and DGrid keys never reach the frontend
- **Four.meme auth tokens** are ephemeral and scoped to the user's wallet session
- **CORS proxy** validates requests and sanitizes payloads before forwarding to Four.meme
- **Token name validation** enforced on both client and server (max 20 chars, no empty strings)
- **No private keys stored** — all signing happens in MetaMask via wagmi
- **Rate limiting** via natural AI response times (no abuse acceleration)

---

## 🌐 Links

- **Live dApp**: *Coming soon*
- **Demo Video**: *Coming soon*
- **Four.meme**: https://four.meme
- **DGrid AI**: https://dgrid.ai
- **Fireworks AI**: https://fireworks.ai
- **Hackathon**: https://dorahacks.io/hackathon/fourmemeaisprint

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 7 |
| Wallet | wagmi 2, RainbowKit 2, viem 2 |
| Backend | Express.js, Axios |
| AI (LLM) | DGrid AI (Claude Haiku 4.5), Fireworks (Kimi K2) |
| AI (Image) | Fireworks (FLUX.1 dev FP8), DGrid (Gemini 3 Pro) |
| Blockchain | BNB Smart Chain (BSC Mainnet) |
| Platform | Four.meme (token launchpad) |
| Data | DexScreener API, Four.meme API |
| Icons | Lucide React |

---

*Built for the Four.Meme AI Sprint Hackathon. AI creates. You launch. The chain does the rest.* 🐸
