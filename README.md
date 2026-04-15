# 🐸 Fourmo — AI-Powered Meme Token Studio

> **One idea. One click. One live token.**
> An end-to-end AI platform that generates, scores, launches, and analyzes meme tokens on BSC — powered by **Four.meme**, **Fireworks AI**, and **DGrid Network**.

---

## 📋 Executive Summary

Fourmo is an AI-powered meme token creation and analysis studio built on BNB Smart Chain. Users type a single idea — *"a frog that trades crypto in its sleep"* — and the platform's multi-stage AI pipeline instantly generates a complete token: name, ticker symbol, logo, lore, launch tweet, and marketing kit. One wallet signature later, the token is live on [Four.meme](https://four.meme).

But Fourmo goes beyond creation. It provides **AI Token Analysis** — a deep health-check engine that fetches real-time on-chain data from Four.meme and DexScreener, then runs it through an LLM to produce a comprehensive health report: momentum, community, curve progress, virality scores, alerts, and actionable recommendations.

The platform uses a **dual AI provider architecture**: [Fireworks AI](https://fireworks.ai) for high-speed inference and [DGrid Network](https://dgrid.ai) for decentralized AI — including GPT-4o, Claude 4.5, and Gemini 3. This is the intersection of **AI × Meme × Web3**.

---

## 🤖 How AI Powers Fourmo

Fourmo runs **six distinct AI endpoints**, each solving a different part of the meme token lifecycle with an incremental UI that shows progress at every stage.

### 1. AI Token Generator — `/api/generate-token`
```
Input  : User idea + Optional Image Style
AI     : LLM (DGrid / Fireworks) with crypto-native system prompt
Output : { name, shortName, desc, label, imageStyle, imagePrompt, imageNegativePrompt, tagline }
```
Translates any idea into a complete token concept. It now supports **Image Style selection** (e.g., Pixel Art, Cyberpunk, 3D Render). If left empty, the AI intelligently chooses the best visual aesthetic for your concept. It generates a detailed, style-aware prompt and a negative prompt to ensure high-quality logo generation.

### 2. AI Logo Generator — `/api/generate-image`
```
Input  : Style-aware imagePrompt + imageNegativePrompt
Output : { imageBase64, dataUrl } — ready for on-chain upload
```
Generates a professional crypto token logo. Now optimized for **DGrid Gemini models**, using specific chat completion formats to bypass traditional image API restrictions and deliver high-fidelity results.

### 3. AI Lore Writer — `/api/generate-lore`
```
Input  : Token concept (name, symbol, description, tagline)
AI     : LLM with crypto Twitter copywriter persona
Output : { tweet, lore, useCase }
```
Creates viral cultural content: a hype-driven launch tweet, an absurd origin story, and a tongue-in-cheek "utility" statement.

### 4. AI Meme Scorer — `/api/score-token`
```
Input  : Token concept + real-time Four.meme trending data
AI     : LLM with crypto meme analyst persona
Output : { overall, catchiness, relatability, memePotential, marketTiming, verdict, tips[] }
```
Scores the concept against the **live market context**. It fetches currently trending tokens from Four.meme to evaluate if your idea fits the current "meta".

### 5. AI Marketing Kit — `/api/marketing-kit`
```
Input  : Token concept + contract address + Four.meme URL
AI     : LLM with crypto marketing expert persona
Output : { tweets[4], telegram[2], hashtags[8] }
```
Generates a complete launch marketing package: 4 tweet types (hype, alpha, community, FUD response), 2 Telegram messages, and 8 curated hashtags.

### 6. AI Token Health Analysis — `/api/analyze-token`
```
Input  : Token address + on-chain data (Four.meme + DexScreener)
AI     : LLM as senior data-driven crypto analyst
Output : { headline, sentiment, overall, dimensions{4}, recommendation, metrics }
```
The most sophisticated feature. It fuses data from:
- **Four.meme API**: Bonding curve progress, native holders, price, and volume.
- **DexScreener API**: Liquidity, buy/sell ratios, and price action for graduated or external tokens.
- **Holder Proxy**: Automatically detects if a token is Four.meme native or external/graduated, adjusting the scoring logic to use transaction-based community proxies when holder data is unavailable.

---

### Complete AI Pipeline Flow
```
User types idea & chooses Style
        │
        ▼
┌─────────────────────────────────────────┐
│  1. AI Generate Token (25%)             │
│     LLM → concept + style-aware prompts │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │  2. AI Lore (50%)
        │  Tweet + Origin Story
        └──────┬──────┘
               │
        ┌──────▼────────────────────────────┐
        │  3. AI Logo (75%)                 │
        │     High-fidelity Image Gen       │
        └──────┬────────────────────────────┘
               │
        ┌──────▼────────────────────────────┐
        │  4. AI Score (90%)                │
        │     + live Four.meme trend data   │
        └──────┬────────────────────────────┘
               │
        ▼  Incremental UI finishes loading
               │
        ┌──────▼────────────────────────────┐
        │  Connect MetaMask → Sign Tx       │
        │  Launch Token on BSC Mainnet      │
        └──────┬────────────────────────────┘
               │
        ▼  Token is LIVE on Four.meme 🚀
               │
        ┌──────▼────────────────────────────┐
        │  AI Marketing Kit & Analysis      │
        │  Post-launch health monitoring    │
        └──────────────────────────────────┘
```

---

## 🔗 DGrid Integration

Fourmo uses **DGrid AI** as a decentralized AI inference provider — a key differentiator from centralized-only solutions.

### Why DGrid?
- **Decentralized Infrastructure**: hardware-anchored backbone.
- **Model Flexibility**: Access to GPT-4o, Claude 4.5, and Gemini 3 via a single gateway.
- **Sovereign Rails**: Aligned with the Web3 philosophy of censorship resistance.

### Gemini 3 Pro Integration
Fourmo includes a custom handler for **Gemini 3 Pro** image generation via DGrid, utilizing the latest chat-completion-based image synthesis to ensure reliability and high aesthetic quality.

---

## 🌐 Four.meme Integration

Fourmo is deeply integrated with the **Four.meme** platform and its BSC smart contracts:

- **Smart Contracts**: Interacts directly with `TokenManager2` (0x5c9...) for on-chain deployment.
- **Full Lifecycle**: create → upload → register → deploy → track → analyze.
- **CORS Proxy**: A robust Express-based proxy handles all Four.meme API interactions, bypassing browser restrictions and providing early validation for token names and metadata.

---

## 🎯 Features

### For Creators
- **🧠 1-Click Concept**: One-sentence idea → AI-crafted brand.
- **🎨 Visual Styling**: Choose from 6+ visual presets or let AI decide.
- **⚡ Incremental UI**: See your token details pop up as they are generated.
- **📊 Context-Aware Score**: Know if your meme is "meta" before you spend gas.
- **📢 Marketing Kit**: Professional tweets and Telegram messages ready to copy-paste.

### For Investors & Analysts
- **🔬 Deep Health Report**: 4-dimension scoring (Momentum, Community, Curve, Virality).
- **📈 Multi-Source Data**: Combines Four.meme on-chain data with DexScreener market data.
- **🎯 Smart Advice**: AI-driven "HOLD / PROMOTE / WATCH / STALE" recommendations.
- **📋 Dashboard**: Search and analyze any token on Four.meme instantly.

---

## 🏗️ Architecture

- **Frontend**: React 18 (Vite) + wagmi/RainbowKit for BSC wallet connection.
- **Backend**: Express.js serverless app (deployed on **Vercel**).
- **AI Stack**: Dual-provider (Fireworks + DGrid) with independent LLM and Image routing.
- **Blockchain**: BNB Smart Chain (BSC) Mainnet.

---

## 🚀 Getting Started

### Setup
```bash
# Install dependencies
npm install
cd server && npm install && cd ..
```

### Configure Environment
- **server/.env**: Set `FIREWORKS_API_KEY`, `DGRID_API_KEY`, and provider preferences (`AI_LLM_PROVIDER`).
- **.env**: (Optional) Set `VITE_WALLETCONNECT_PROJECT_ID`.

### Run Locally
```bash
# Run both frontend and backend
npm dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

---

## 🗺️ Roadmap
- ✅ 4-Stage AI Pipeline with Incremental UI
- ✅ DexScreener + Four.meme Hybrid Analysis
- ✅ DGrid Gemini 3 Image Integration
- ✅ Image Style Selection
- 🔜 **AI Agent Mode**: Autonomous token monitoring & price alerts.
- 🔜 **Batch Scoring**: Score entire trending lists in one click.
- 🔮 **Multi-chain expansion**: Solana & Base support.

---

*Built for the Four.Meme AI Sprint Hackathon. AI creates. You launch. The chain does the rest.* 🐸
