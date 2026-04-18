# 🐸 Fourmo —  AI-powered meme token creation and analysis

> **One idea. One click. One live token.**
> The end-to-end AI studio that generates, scores, launches, and analyzes meme tokens on BSC — powered by **Four.meme**, **Fireworks AI**, and **DGrid Network**.

---

## 📋 Executive Summary

Fourmo is an AI-powered meme token creation and analysis studio built on BNB Smart Chain. Type a single idea, and a **7-stage AI pipeline** instantly produces a complete token: name, ticker, logo, lore, launch tweet, viral score, and a full marketing kit. One wallet signature later, the token is live on [Four.meme](https://four.meme).

But Fourmo goes beyond creation. It ships a **dedicated AI Trend Discovery page** that pulls multi-chain market data from DexScreener in real time and runs it through an LLM to surface the next viral meme narratives before they peak. And for any token already live on Four.meme, the **AI Token Health Analysis** engine fuses on-chain bonding-curve data with DEX market data into a single, scored health report.

This is the intersection of **AI × Meme × Web3** — the three forces shaping crypto culture right now, united in one tool.

---

## 🏆 Hackathon Track

**Four.meme AI Sprint Hackathon**

> *"Build the best AI-powered tool in the meme token ecosystem."*

- **Live Demo**: [fourmo-ai.vercel.app](https://fourmo-ai.vercel.app)
- **Demo Video**: [youtube.com/watch?v=3BB8pdcakGc](https://youtube.com/watch?v=3BB8pdcakGc)

---

## 🤖 How AI Powers Fourmo — 7 Distinct Endpoints

Fourmo runs **seven AI endpoints**, each solving a different part of the meme token lifecycle. The UI shows incremental progress at every stage so users see the token materialize in real time.

### 1. AI Token Generator — `/api/generate-token`
```
Input  : User idea (free text) + Optional Image Style preset
AI     : LLM with crypto-native system prompt (DGrid / Fireworks)
Output : { name, shortName, desc, label, imageStyle,
           imagePrompt, imageNegativePrompt, tagline }
```
Translates any idea into a complete token concept. Supports **6+ Image Style presets** (Pixel Art, Cyberpunk, 3D Render, Anime, etc.). If left empty, the AI intelligently selects the most fitting visual aesthetic. It also generates a detailed, style-aware logo prompt **and** a negative prompt to minimize artifacts.

### 2. AI Logo/Image Generator — `/api/generate-image`
```
Input  : Style-aware imagePrompt + imageNegativePrompt
AI     : DGrid Gemini 3 Pro (chat-completion-based image synthesis)
Output : { imageBase64, dataUrl } — ready for on-chain upload
```
Generates a high-fidelity crypto token logo. Uses a custom handler for **Gemini 3 Pro** via DGrid — bypassing traditional image API restrictions to deliver production-quality results.

### 3. AI Lore Writer — `/api/generate-lore`
```
Input  : Token concept (name, symbol, description, tagline)
AI     : LLM with crypto Twitter copywriter persona
Output : { tweet, lore, useCase }
```
Creates viral cultural content: a hype-driven launch tweet, an absurd origin story, and a tongue-in-cheek "utility" statement designed for CT engagement.

### 4. AI Meme Scorer — `/api/score-token`
```
Input  : Token concept + live Four.meme trending data
AI     : LLM with crypto meme analyst persona
Output : { overall, catchiness, relatability,
           memePotential, marketTiming, verdict, tips[] }
```
Scores the concept against **live market context** by fetching currently trending tokens from Four.meme. Tells you if your meme fits the current meta *before* you spend gas.

### 5. AI Marketing Kit — `/api/marketing-kit`
```
Input  : Token concept + contract address + Four.meme URL
AI     : LLM with crypto marketing expert persona
Output : { tweets[4], telegram[2], hashtags[8] }
```
Generates a complete launch package: 4 tweet types (hype, alpha, community, FUD-response), 2 Telegram messages, and 8 curated hashtags. Copy-paste ready.

### 6. AI Token Health Analysis — `/api/analyze-token`
```
Input  : Token address + on-chain data (Four.meme + DexScreener)
AI     : LLM as senior data-driven crypto analyst
Output : { headline, sentiment, overall, dimensions{4},
           recommendation, metrics }
```
The most sophisticated feature. Fuses data from two independent sources:
- **Four.meme API**: Bonding curve progress, native holders, price, volume.
- **DexScreener API**: Liquidity, buy/sell ratios, price action for graduated/external tokens.
- **Holder Proxy Logic**: Auto-detects if a token is Four.meme native or graduated, adjusting scoring to use transaction-based community proxies when holder data is unavailable.

Output: a 4-dimension score (Momentum, Community, Curve, Virality) + a clear **HOLD / PROMOTE / WATCH / STALE** recommendation.

### 7. AI Trend Discovery — `/api/trend-analysis`
```
Input  : Live DexScreener token profiles + boosted tokens
AI     : LLM as multi-chain trend analyst
Output : Narrative trend report + scored token list
```
Pulls the latest token profiles **and** the top boosted tokens from DexScreener simultaneously, then synthesizes them into an AI narrative: what themes are gaining momentum, which chains are active, and where the next wave is likely to come from.

---

### Complete AI Pipeline Flow

```
User types idea + chooses Style
        │
        ▼
┌──────────────────────────────────────┐
│  1. AI Generate Token (20%)          │
│     LLM → concept + style-aware      │
│     prompts + negative prompts       │
└─────────────┬────────────────────────┘
              │
       ┌──────▼──────┐
       │ 2. AI Lore  │ (35%)
       │   Tweet +   │
       │ Origin Story│
       └──────┬──────┘
              │
       ┌──────▼────────────────────────┐
       │  3. AI Logo (60%)             │
       │     Gemini 3 Pro via DGrid    │
       │     High-fidelity Image Gen   │
       └──────┬────────────────────────┘
              │
       ┌──────▼────────────────────────┐
       │  4. AI Score (80%)            │
       │     + live Four.meme trends   │
       └──────┬────────────────────────┘
              │
       ▼  Incremental UI finishes loading
              │
       ┌──────▼────────────────────────┐
       │  Connect MetaMask → Sign Tx   │
       │  Token LIVE on BSC Mainnet    │
       └──────┬────────────────────────┘
              │
       ┌──────▼────────────────────────┐
       │  5. AI Marketing Kit          │
       │  6. AI Token Health Analysis  │
       │  7. AI Trend Discovery        │
       └───────────────────────────────┘
```

---

## 🔗 DGrid Integration — Decentralized AI on Web3 Rails

Fourmo uses **DGrid AI** as its primary decentralized inference provider, a key architectural differentiator from centralized-only solutions.

### Why DGrid?
| Property | Centralized AI | DGrid |
|---|---|---|
| Infrastructure | Single provider | Hardware-anchored, decentralized |
| Model Access | One model family | GPT-4o, Claude 4.5, Gemini 3 via one gateway |
| Ethos | Closed | Aligned with Web3 sovereignty |
| Censorship Risk | Yes | ❌ Resistant |

### Gemini 3 Pro Image Handler
Fourmo implements a custom handler for **Gemini 3 Pro** image generation via DGrid, using the latest chat-completion-based image synthesis format. This is not a standard image API call — it's a novel integration pattern that unlocks high-aesthetic results that would otherwise be blocked by traditional image API restrictions.

```javascript
// DGrid Gemini 3 — chat-completion-based image synthesis
{
  model: "google/gemini-3-pro",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: imagePrompt },
      { type: "text", text: `Negative: ${imageNegativePrompt}` }
    ]
  }]
}
```

---

## 🌐 Four.meme Integration — Full Lifecycle

Fourmo is deeply embedded in the **Four.meme** platform and its BSC smart contracts. It doesn't just post metadata to an API — it walks the complete token lifecycle:

```
Create → Upload → Register → Deploy → Track → Analyze
```

- **Smart Contracts**: Direct interaction with `TokenManager2` (`0x5c952...`) for on-chain deployment.
- **CORS Proxy**: An Express-based proxy handles all Four.meme API interactions, bypassing browser restrictions and providing early validation for token names and metadata before any gas is spent.
- **Live Trending Feed**: Real-time trending token data from Four.meme is injected into the Meme Scorer, ensuring scores reflect the current market meta.

---

## 📊 AI Trend Discovery — The Alpha Engine

The **Trend Discovery** page is Fourmo's most forward-looking feature and stands alone as a product. It answers the question every meme coin trader actually asks: *"What should I be launching next?"*

### How it works

```
DexScreener /token-profiles/latest ──┐
                                     ├──► AI Trend Analyst LLM ──► Narrative Report
DexScreener /token-boosts/top ───────┘                            + Scored Token List
```

The AI synthesizes two real-time feeds:
1. **Latest token profiles** — what narratives are being deployed right now
2. **Top boosted tokens** — where the real marketing money is flowing

Output is a structured trend report with: overall market sentiment, chain-by-chain activity, theme analysis, and a scored list of tokens sorted by AI-assessed opportunity.

---

## 🎯 Feature Summary

### For Creators
- **🧠 1-Click Concept**: One sentence → AI-crafted brand identity.
- **🎨 Style Selection**: 6+ visual presets or let AI choose.
- **⚡ Incremental UI**: Watch token details appear in real time as each AI stage completes.
- **📊 Context-Aware Score**: Know if your meme is "meta" before spending gas.
- **📢 Marketing Kit**: Pro tweets and Telegram copy, paste-ready at launch.

### For Investors & Analysts
- **🔬 Token Health Report**: 4-dimension scoring (Momentum, Community, Curve, Virality).
- **📈 Multi-Source Fusion**: Four.meme on-chain + DexScreener market data combined.
- **🎯 Clear Recommendation**: HOLD / PROMOTE / WATCH / STALE — no ambiguity.
- **📋 Instant Lookup**: Search any Four.meme token address for immediate analysis.

### For Traders & Trend Hunters
- **🌊 AI Trend Discovery**: Real-time multi-chain narrative analysis.
- **🔥 Boosted Token Intelligence**: Know where capital is flowing before the crowd does.
- **📡 Live Market Sentiment**: Bullish / Bearish / Neutral scored per token.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│  React 18 (Vite) + wagmi + RainbowKit                    │
│  BSC Mainnet wallet connection                           │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼───────────────────────────────────┐
│                  BACKEND                                 │
│  Express.js · 7 AI endpoints · Four.meme CORS proxy      │
│                                                          │
│  ┌─────────────────┐       ┌──────────────────────────┐  │
│  │  Fireworks AI   │       │      DGrid Network       │  │
│  │  (LLM fallback) │       │  GPT-4o / Claude 4.5 /   │  │
│  └─────────────────┘       │  Gemini 3 Pro            │  │
│                            └──────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
 Four.meme API   DexScreener API  BSC Mainnet
 (on-chain data) (market data)   (TokenManager2)
```

**Stack summary:**
- **Frontend**: React 18 (Vite), wagmi, RainbowKit
- **Backend**: Express.js
- **AI**: Dual-provider — Fireworks AI (LLM fallback) + DGrid Network (primary: GPT-4o, Claude 4.5, Gemini 3)
- **Blockchain**: BNB Smart Chain Mainnet
- **Data**: Four.meme API + DexScreener API (real-time)

---

## 🔬 Judging Criteria — Self Assessment

### ✅ AI Integration Depth
- **7 distinct AI endpoints**, each with a purpose-built system prompt and structured JSON output schema.
- **Dual AI provider architecture** — Fireworks AI for speed, DGrid for decentralization and model variety.
- **Novel Gemini 3 Pro image handler** via DGrid's chat-completion format.
- AI is not a wrapper — it is the core product loop. Every token creation decision flows through LLM reasoning.

### ✅ Four.meme Integration
- Full token lifecycle: concept → upload → register → deploy → track → analyze.
- Direct interaction with `TokenManager2` on BSC Mainnet.
- Live trending data from Four.meme injected into AI scoring for real-time market context.
- Robust CORS proxy for all Four.meme API interactions with early validation.

### ✅ Web3 Alignment
- One wallet signature deploys a live token on BSC — zero code required from the user.
- DGrid decentralized AI infrastructure aligns with Web3's censorship-resistance ethos.
- All token analysis references on-chain data — no centralized databases.

### ✅ User Experience
- **Incremental UI**: users see live progress across all AI stages, not a blank loading screen.
- **Trend Discovery**: a standalone alpha tool valuable to traders who never create a token.
- **Marketing Kit**: lowers the barrier from "token is live" to "community is growing."
- Mobile-friendly, fast, and deployed at a stable Vercel URL.

---

## 🚀 Getting Started

### Setup

```bash
# Install dependencies
npm install
cd server && npm install && cd ..
```

### Configure Environment

**`server/.env`**
```env
FIREWORKS_API_KEY=your_fireworks_key
DGRID_API_KEY=your_dgrid_key
AI_LLM_PROVIDER=dgrid          # or 'fireworks'
AI_IMAGE_PROVIDER=dgrid        # or 'fireworks'
```

**`.env`** (optional)
```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

### Run Locally

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-token` | Generate token concept from idea |
| `POST` | `/api/generate-image` | Generate token logo |
| `POST` | `/api/generate-lore` | Generate lore + launch tweet |
| `POST` | `/api/score-token` | Score meme potential vs live trends |
| `POST` | `/api/marketing-kit` | Generate full marketing package |
| `POST` | `/api/analyze-token` | Deep health analysis for any token |
| `POST` | `/api/trend-analysis` | Real-time multi-chain trend discovery |
| `GET` | `/api/health` | Provider status check |
| `ALL` | `/api/four-meme/*` | Four.meme CORS proxy |

---

## 🗺️ Roadmap

| Status | Feature |
|---|---|
| ✅ Done | 4-stage AI creation pipeline with incremental UI |
| ✅ Done | DGrid Gemini 3 Pro image integration |
| ✅ Done | Image Style selection (6+ presets) |
| ✅ Done | DexScreener + Four.meme hybrid token analysis |
| ✅ Done | AI Trend Discovery with multi-source data fusion |
| ✅ Done | Full marketing kit generation |
| 🔜 Next | **AI Agent Mode**: autonomous token monitoring & price alerts |
| 🔜 Next | **Batch Scoring**: analyze entire trending lists in one click |
| 🔮 Future | Multi-chain expansion: Solana & Base |
| 🔮 Future | Social graph integration: auto-post marketing kit to X/Telegram |

---

## 🔒 Technical Notes

### Token Deployment Contract
```
TokenManager2: 0x5c952063c7fc8610CBDB97d9B591A35d9D4FA67C (BSC Mainnet)
```

### AI Provider Switching
The backend supports hot-switching between Fireworks AI and DGrid via environment variables with zero code changes. This ensures the platform is resilient to provider outages.

### Holder Proxy Logic
Four.meme native tokens don't expose holder counts via the public API. Fourmo detects this automatically and falls back to a transaction-count-based community proxy metric — the analysis never silently fails or returns empty data.

---

## 🌐 Links

- **Live App**: [fourmo-ai.vercel.app](https://fourmo-ai.vercel.app)
- **Demo Video**: [youtube.com/watch?v=3BB8pdcakGc](https://youtube.com/watch?v=3BB8pdcakGc)
- **Four.meme**: [four.meme](https://four.meme)
- **DGrid Network**: [dgrid.ai](https://dgrid.ai)
- **Fireworks AI**: [fireworks.ai](https://fireworks.ai)

---

*Built for the Four.meme AI Sprint Hackathon. AI creates. You launch. The chain does the rest.* 🐸