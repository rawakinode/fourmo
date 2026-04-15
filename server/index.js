/**
 * server/index.js
 *
 * Express backend for MemeAgent Studio.
 *
 * Responsibilities:
 *   - AI generation endpoints (token concept, image, lore, viral score, marketing kit)
 *   - Token health analysis with DexScreener enrichment
 *   - CORS proxy for Four.meme API (bypasses browser restrictions)
 *
 * Supports two AI providers (configurable via .env):
 *   - Fireworks AI: Kimi K2 (LLM) + FLUX.1 (image)
 *   - DGrid AI: GPT-4o (LLM) + DALL-E 3 (image)
 *
 * Usage: node server/index.js
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import axios from 'axios'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use('/api/four-meme', express.raw({ type: '*/*', limit: '10mb' }))

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.url}`)
  next()
})

// AI provider selection — can mix LLM and image providers independently
const AI_LLM_PROVIDER = process.env.AI_LLM_PROVIDER || 'fireworks'
const AI_IMAGE_PROVIDER = process.env.AI_IMAGE_PROVIDER || 'fireworks'

const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY
const DGRID_API_KEY = process.env.DGRID_API_KEY

// Fireworks AI clients
const fireworksLlm = axios.create({
  baseURL: 'https://api.fireworks.ai/inference/v1',
  headers: { Authorization: `Bearer ${FIREWORKS_API_KEY}`, 'Content-Type': 'application/json' },
  timeout: 120_000, maxContentLength: Infinity, maxBodyLength: Infinity,
})

const fireworksImgApi = axios.create({
  baseURL: 'https://api.fireworks.ai/inference/v1',
  headers: { Authorization: `Bearer ${FIREWORKS_API_KEY}`, 'Content-Type': 'application/json', Accept: 'image/jpeg' },
  responseType: 'arraybuffer',
  timeout: 120_000, maxContentLength: Infinity, maxBodyLength: Infinity,
})

const FIREWORKS_LLM_MODEL = process.env.FIREWORKS_LLM_MODEL || 'accounts/fireworks/models/kimi-k2-instruct-0905'
const FIREWORKS_IMAGE_MODEL = process.env.FIREWORKS_IMAGE_MODEL || 'accounts/fireworks/models/flux-1-dev-fp8'

// DGrid AI client
const dgridApi = axios.create({
  baseURL: 'https://api.dgrid.ai/v1',
  headers: { Authorization: `Bearer ${DGRID_API_KEY}`, 'Content-Type': 'application/json' },
  timeout: 120_000, maxContentLength: Infinity, maxBodyLength: Infinity,
})

const DGRID_LLM_MODEL = process.env.DGRID_LLM_MODEL || 'gpt-4o'
const DGRID_IMAGE_MODEL = process.env.DGRID_IMAGE_MODEL || 'dall-e-3'

// Resolved model names based on provider selection
const LLM_MODEL = AI_LLM_PROVIDER === 'dgrid' ? DGRID_LLM_MODEL : FIREWORKS_LLM_MODEL
const IMAGE_MODEL = AI_IMAGE_PROVIDER === 'dgrid' ? DGRID_IMAGE_MODEL : FIREWORKS_IMAGE_MODEL

/**
 * Sends a chat completion request to the active LLM provider.
 * Forces JSON response format. Strips <think> tags from reasoning models.
 */
async function chat(systemPrompt, userPrompt, maxTokens = 1000) {
  const model = LLM_MODEL
  const payload = {
    model, max_tokens: maxTokens, temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
  }

  let res;
  if (AI_LLM_PROVIDER === 'dgrid') {
    res = await dgridApi.post('/chat/completions', payload)
  } else {
    res = await fireworksLlm.post('/chat/completions', payload)
  }
  return res.data.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

/**
 * Fetches currently trending tokens from Four.meme.
 * Used as market context for AI scoring (market timing dimension).
 */
async function fetchHotContext(limit = 8) {
  try {
    const resp = await axios.post(
      'https://four.meme/meme-api/v1/public/token/search',
      { type: 'HOT', listType: 'NOR', status: 'TRADE', sort: 'DESC', pageIndex: 1, pageSize: limit },
      { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, timeout: 8000 }
    )
    const tokens = resp.data?.data?.data || []
    return tokens.map(t => `${t.name}($${t.symbol})[${t.tag}]`).join(', ')
  } catch { return '' }
}

/**
 * Fetches token data from DexScreener (free, no API key).
 * Returns the primary pair (highest liquidity) with price, volume,
 * liquidity, and transaction data in USD. Returns null on failure.
 */
async function fetchDexScreener(tokenAddress) {
  try {
    const resp = await axios.get(
      `https://api.dexscreener.com/tokens/v1/bsc/${tokenAddress}`,
      { timeout: 8000 }
    )
    const pairs = resp.data
    if (!Array.isArray(pairs) || pairs.length === 0) return null
    // Pick the pair with highest liquidity
    const pair = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
    return {
      priceUsd: parseFloat(pair.priceUsd || 0),
      liquidityUsd: pair.liquidity?.usd || 0,
      fdvUsd: pair.fdv || 0,
      marketCapUsd: pair.marketCap || 0,
      volume24hUsd: pair.volume?.h24 || 0,
      volumeH6Usd: pair.volume?.h6 || 0,
      volumeH1Usd: pair.volume?.h1 || 0,
      priceChangeH1: pair.priceChange?.h1 || 0,
      priceChangeH6: pair.priceChange?.h6 || 0,
      priceChangeH24: pair.priceChange?.h24 || 0,
      txnsH24Buys: pair.txns?.h24?.buys || 0,
      txnsH24Sells: pair.txns?.h24?.sells || 0,
      txnsH1Buys: pair.txns?.h1?.buys || 0,
      txnsH1Sells: pair.txns?.h1?.sells || 0,
      dexId: pair.dexId || 'unknown',
      pairAddress: pair.pairAddress || '',
      pairUrl: pair.url || '',
    }
  } catch (e) {
    console.warn('[dexscreener]', e.message)
    return null
  }
}

// Health check — also reports active provider config
app.get('/api/health', (_req, res) => res.json({ ok: true, llmProvider: AI_LLM_PROVIDER, imageProvider: AI_IMAGE_PROVIDER, llm: LLM_MODEL, image: IMAGE_MODEL }))

// ---------------------------------------------------------------------------
// POST /api/generate-token
// Takes a user's meme idea and generates a complete token concept via AI.
// Accepts optional imageStyle to guide the image generation aesthetic.
// Returns: { name, shortName, desc, label, imagePrompt, imageNegativePrompt, imageStyle, tagline }
// ---------------------------------------------------------------------------
app.post('/api/generate-token', async (req, res) => {
  const { idea, imageStyle } = req.body
  if (!idea?.trim()) return res.status(400).json({ error: 'idea is required' })

  // Build style instruction — either use user's preference or let AI decide freely
  const styleInstruction = imageStyle?.trim()
    ? `- The user wants the image style to be: "${imageStyle}". Build the imagePrompt and imageNegativePrompt fully around this style.`
    : `- imageStyle: freely choose the best visual style for this token concept. Examples: "bold flat vector illustration", "pixel art 8-bit", "anime chibi mascot", "hyper-realistic 3D render", "watercolor sketch", "glitch cyberpunk", "oil painting", "graffiti street art", etc. Be creative and pick what fits best.`

  try {
    const text = await chat(
      'You are a meme token creative director specializing in viral crypto culture. Default language is English and all generated text fields must be in English only. You always respond with valid JSON only — no markdown, no preamble, no explanation.',
      `Given the user's idea below, create a brilliant meme token concept for BSC/Four.meme.

User idea: "${idea}"

Rules:
- name: catchy, memorable, max 20 chars, NO emojis, ENGLISH only (Strictly NO emojis)
- shortName: 3–6 uppercase letters only
- desc: funny, viral, crypto-native, max 200 chars, ENGLISH only
- label: exactly one of: Meme | AI | Defi | Games | Infra | De-Sci | Social | Depin | Charity | Others
- imageStyle: the art/visual style for the token image. One descriptive phrase (e.g. "bold flat vector illustration", "anime chibi mascot", "hyper-realistic 3D render").
${styleInstruction}
- imagePrompt: a vivid, detailed image generation prompt FULLY TAILORED to the chosen imageStyle. Include: the main character/subject, color palette, lighting, composition, background, and all visual details that match the style. Do NOT hardcode a generic style — let imageStyle drive everything.
- imageNegativePrompt: a negative prompt listing what to AVOID in the image (e.g. "text, watermark, blurry, low quality, ugly, deformed, extra limbs"). Tailor to the style's common failure modes.
- tagline: punchy one-liner under 100 chars, must include $SYMBOL, ENGLISH only

Respond with ONLY this JSON Format:
{
  "name": "...",
  "shortName": "...",
  "desc": "...",
  "label": "...",
  "imageStyle": "...",
  "imagePrompt": "...",
  "imageNegativePrompt": "...",
  "tagline": "..."
}

IMPORTANT: Follow the rules exactly. If user idea is not English, translate intent to English before generating. Respond with valid JSON only. Do not include any explanations, preambles, or markdown formatting.`,
      1200,
    )

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found in response')
    res.json(JSON.parse(match[0]))
  } catch (e) {
    console.error('[generate-token]', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ---------------------------------------------------------------------------
// POST /api/generate-image
// Generates a token logo via AI image generation.
// Uses the imagePrompt generated by /api/generate-token (style-aware, AI-crafted).
// Optionally accepts imageNegativePrompt for providers that support it.
// Returns: { imageBase64, mediaType, dataUrl }
// ---------------------------------------------------------------------------
app.post('/api/generate-image', async (req, res) => {
  const { prompt, name, shortName, imageNegativePrompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'prompt is required' })
  try {
    // The prompt from generate-token is already fully style-aware.
    // We add only minimal mandatory context (token identity + square format),
    // so the server never overrides the AI-chosen aesthetic.
    const finalPrompt =
      `Crypto meme coin logo for "${name}" ($${shortName}). ${prompt}. ` +
      `Square format, centered composition, no text overlays.`

    const negativePrompt = imageNegativePrompt ||
      'text, watermark, blurry, low quality, ugly, deformed, extra limbs, bad anatomy, signature, border, frame'

    let base64;
    if (AI_IMAGE_PROVIDER === 'dgrid') {
      // Gemini models use the native generateContent endpoint
      // OpenAI-style /images/generations only supports dall-e-2/dall-e-3
      const isGeminiModel = IMAGE_MODEL.toLowerCase().includes('gemini')

      if (isGeminiModel) {
        const response = await dgridApi.post('/chat/completions', {
          model: IMAGE_MODEL,
          stream: false,
          messages: [{ role: 'user', content: finalPrompt }]
        })
        const contentStr = response.data?.choices?.[0]?.message?.content || ''
        const base64Match = contentStr.match(/data:image\/[^;]+;base64,([^"\)\s]+)/)
        if (!base64Match) throw new Error('No image returned from DGrid Gemini model')
        base64 = base64Match[1]
      } else {
        // DALL-E or other OpenAI-compatible models
        const response = await dgridApi.post('/images/generations', {
          model: IMAGE_MODEL,
          prompt: finalPrompt,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        })
        base64 = response.data.data[0].b64_json
      }
    } else {
      const response = await fireworksImgApi.post(`/workflows/${IMAGE_MODEL}/text_to_image`, {
        prompt: finalPrompt,
        negative_prompt: negativePrompt,
        aspect_ratio: '1:1',
        guidance_scale: 4.5,
        num_inference_steps: 30,
      })
      base64 = Buffer.from(response.data).toString('base64')
    }

    res.json({ imageBase64: base64, mediaType: 'image/jpeg', dataUrl: `data:image/jpeg;base64,${base64}` })
  } catch (e) {
    let msg = e.message;
    if (e.response?.data) {
      try {
        msg = Buffer.isBuffer(e.response.data) ? Buffer.from(e.response.data).toString('utf8') : JSON.stringify(e.response.data);
      } catch (err) {
        msg = 'Error processing API error response';
      }
    }
    console.error('[generate-image]', msg)
    res.status(500).json({ error: msg })
  }
})

// ---------------------------------------------------------------------------
// POST /api/generate-lore
// Generates lore, launch tweet, and use-case for a token.
// Returns: { tweet, lore, useCase }
// ---------------------------------------------------------------------------
app.post('/api/generate-lore', async (req, res) => {
  const { name, shortName, desc, tagline } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  try {
    const text = await chat(
      'You are a crypto Twitter copywriter and meme lore writer. Default language is English and all generated text fields must be in English only. You always respond with valid JSON only — no markdown, no preamble.',
      `Create viral social content for this meme token:

Token: ${name} ($${shortName})
Description: ${desc}
Tagline: ${tagline || ''}

Generate:
- tweet: Launch tweet, max 280 chars, ENGLISH only. Must include $${shortName}. Include 2–3 hashtags. Punchy, hype, authentic crypto Twitter voice.
- lore: 2–3 sentence absurd/funny origin story for this token, ENGLISH only. Culturally specific.
- useCase: One sentence of absurd but internally logical "utility" for this token, ENGLISH only.

Respond with ONLY this JSON:
{ "tweet": "...", "lore": "...", "useCase": "..." }`,
      800,
    )
    const clean = text.replace(/^```json?\n?|\n?```$/g, '').trim()
    res.json(JSON.parse(clean))
  } catch (e) {
    console.error('[generate-lore]', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ---------------------------------------------------------------------------
// POST /api/score-token
// Scores a token concept's viral potential across 4 dimensions.
// Input:  { name, shortName, desc, lore, tagline, label }
// Returns: { overall, catchiness, relatability, memePotential, marketTiming, verdict, tips[] }
// ---------------------------------------------------------------------------
app.post('/api/score-token', async (req, res) => {
  const { name, shortName, desc, lore, tagline, label } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  try {
    const hotCtx = await fetchHotContext(8)
    const text = await chat(
      'You are a crypto meme analyst who scores token concepts for viral potential on Four.meme (BNB Chain). Default language is English and all generated text fields must be in English only. Respond ONLY with valid JSON — no markdown, no extra text.',
      `Analyze this meme token concept and score it:

Token: ${name} ($${shortName})
Category: ${label || 'Meme'}
Description: ${desc}
Lore: ${lore || 'none'}
Tagline: ${tagline || 'none'}
${hotCtx ? `\nCurrently trending on Four.meme: ${hotCtx}` : ''}

Score each dimension 0–100:
- catchiness: name memorability, ease of pronunciation, uniqueness
- relatability: resonance with crypto culture and current internet vibes
- memePotential: meme-ability, spreadability, joke potential
- marketTiming: fit with current market trends based on trending tokens above
- overall: weighted average (catchiness 25% + relatability 25% + memePotential 30% + marketTiming 20%)

Also:
- verdict: 1-2 sentence honest assessment, crypto-native tone, max 120 chars total, ENGLISH only
- tips: exactly 3 short concrete improvement suggestions, each max 60 chars, ENGLISH only

Respond ONLY with this JSON:
{
  "overall": 0,
  "catchiness": 0,
  "relatability": 0,
  "memePotential": 0,
  "marketTiming": 0,
  "verdict": "...",
  "tips": ["...", "...", "..."]
}`,
      600
    )
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    res.json(JSON.parse(match[0]))
  } catch (e) {
    console.error('[score-token]', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ---------------------------------------------------------------------------
// POST /api/marketing-kit
// Generates a complete marketing kit for a launched token.
// Input:  { name, shortName, desc, lore, tagline, tokenAddress, fourMemeUrl }
// Returns: { tweets:[{type,text}], telegram:[{type,text}], hashtags:string[] }
// ---------------------------------------------------------------------------
app.post('/api/marketing-kit', async (req, res) => {
  const { name, shortName, desc, lore, tagline, tokenAddress, fourMemeUrl } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  try {
    const text = await chat(
      'You are a crypto marketing expert for BSC meme tokens. You write viral crypto Twitter and Telegram content. Default language is English and all generated text fields must be in English only. Respond ONLY with valid JSON — no markdown, no preamble.',
      `Create a complete marketing kit for this LIVE meme token:

Token: ${name} ($${shortName})
Description: ${desc}
Lore: ${lore || 'none'}
Tagline: ${tagline || 'none'}
Contract: ${tokenAddress || 'TBA'}
Link: ${fourMemeUrl || 'https://four.meme'}

Generate:
tweets — 4 items with "type" + "text" (max 280 chars, must include $${shortName}, ENGLISH only):
  "hype" → max energy launch announcement, 2-3 emojis
  "alpha" → mysterious "few understand this..." alpha leak style
  "community" → invite people to join, WAGMI energy
  "fud_response" → confident reply to skeptics, unbothered

telegram — 2 items with "type" + "text" (ENGLISH only):
  "announcement" → formal launch, 3-4 sentences, include contract + four.meme link
  "community" → casual fun welcome for new holders

hashtags → exactly 8 strings without # (mix: BSC general + meme culture + token-specific)

Respond ONLY with this JSON:
{
  "tweets": [
    {"type": "hype", "text": "..."},
    {"type": "alpha", "text": "..."},
    {"type": "community", "text": "..."},
    {"type": "fud_response", "text": "..."}
  ],
  "telegram": [
    {"type": "announcement", "text": "..."},
    {"type": "community", "text": "..."}
  ],
  "hashtags": ["BSC", "Meme", "BNBChain", "FourMeme", "...", "...", "...", "..."]
}`,
      1400
    )
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    res.json(JSON.parse(match[0]))
  } catch (e) {
    console.error('[marketing-kit]', e.message)
    res.status(500).json({ error: e.message })
  }
})


// ---------------------------------------------------------------------------
// POST /api/analyze-token
// Full AI health analysis for any Four.meme BSC token.
// Enriches with DexScreener data for graduated/non-native tokens.
// Returns a comprehensive report with scores, metrics, signals, and recommendation.
// ---------------------------------------------------------------------------
app.post('/api/analyze-token', async (req, res) => {
  const { tokenAddress, tokenData } = req.body
  if (!tokenAddress) return res.status(400).json({ error: 'tokenAddress required' })

  // Four.meme native tokens have addresses ending with 4444
  const isFourMemeNative = tokenAddress.toLowerCase().endsWith('4444')

  const d = tokenData || {}
  const name = d.name || d.tokenName || 'Unknown Token'
  const shortName = d.shortName || '???'
  const desc = d.desc || d.description || ''
  const status = d.status || 'PUBLISH'
  const progress = parseFloat(d.progress || 0)
  let cap = parseFloat(d.cap || d.marketCap || 0)
  const holders = parseInt(d.holders || d.hold || 0)
  const volume24h = parseFloat(d.volume || d.day1Vol || 0)
  let price = parseFloat(d.price || 0)
  const increase = parseFloat(d.increase || d.dayIncrease || d.day1Increase || 0)
  const createDate = d.createDate ? new Date(Number(d.createDate)).toISOString() : 'unknown'
  const tag = d.tag || d.label || 'Meme'
  const isGraduated = status === 'TRADE' || d.liquidityAdded === true

  // Extended metrics from tokenPrice object
  let tradingUsd = parseFloat(d.tradingUsd || 0)
  const dayTrading = parseFloat(d.dayTrading || 0)
  const raisedAmount = parseFloat(d.raisedAmount || 0)
  let liquidity = parseFloat(d.liquidity || 0)
  const hourIncrease = parseFloat(d.hourIncrease || 0)
  const fourHourIncrease = parseFloat(d.fourHourIncrease || 0)
  const maxPrice = parseFloat(d.maxPrice || 0)

  const ageHours = d.createDate
    ? Math.floor((Date.now() - Number(d.createDate)) / 3600000)
    : null

  const progressPct = (progress * 100).toFixed(1)

  // Enrich with DexScreener data for graduated or non-native tokens
  let dex = null
  if (isGraduated || !isFourMemeNative) {
    dex = await fetchDexScreener(tokenAddress)
    if (dex) {
      console.log(`[analyze-token] DexScreener enrichment for ${tokenAddress}: volume24h=$${dex.volume24hUsd}, liq=$${dex.liquidityUsd}`)
    }
  }

  // Extract DexScreener values (0 if not available)
  const dexVolume24hUsd = dex?.volume24hUsd || 0
  const dexLiquidityUsd = dex?.liquidityUsd || 0
  const dexMarketCapUsd = dex?.marketCapUsd || 0
  const dexFdvUsd = dex?.fdvUsd || 0
  const dexPriceUsd = dex?.priceUsd || 0
  const dexTxns24hBuys = dex?.txnsH24Buys || 0
  const dexTxns24hSells = dex?.txnsH24Sells || 0
  const dexTxns24hTotal = dexTxns24hBuys + dexTxns24hSells
  const dexTxnsH1Buys = dex?.txnsH1Buys || 0
  const dexTxnsH1Sells = dex?.txnsH1Sells || 0
  const dexPriceChangeH1 = dex?.priceChangeH1 || 0
  const dexPriceChangeH6 = dex?.priceChangeH6 || 0
  const dexPriceChangeH24 = dex?.priceChangeH24 || 0

  // Holder data is only reliable for native Four.meme tokens
  const holderDataAvailable = isFourMemeNative && holders > 0

  // Build trading activity section for the AI prompt
  let tradingSection = ''
  if (holderDataAvailable) {
    tradingSection += `- Holders: ${holders}\n`
  } else {
    tradingSection += `- Holders: N/A (not tracked for this token type — use transaction count as proxy)\n`
  }
  tradingSection += `- Total Volume: ${volume24h.toFixed(4)} BNB\n`
  tradingSection += `- Volume (USD): $${tradingUsd.toFixed(2)}\n`
  tradingSection += `- 24h Volume: ${dayTrading.toFixed(4)} BNB\n`
  tradingSection += `- Liquidity: ${liquidity.toFixed(4)} BNB\n`

  // Append DexScreener data if available
  if (dex) {
    tradingSection += `\nDEX DATA (from DexScreener):\n`
    tradingSection += `- DEX Price (USD): $${dexPriceUsd.toFixed(6)}\n`
    tradingSection += `- DEX 24h Volume (USD): $${dexVolume24hUsd.toFixed(2)}\n`
    tradingSection += `- DEX Liquidity (USD): $${dexLiquidityUsd.toFixed(2)}\n`
    tradingSection += `- DEX Market Cap (USD): $${dexMarketCapUsd.toFixed(2)}\n`
    tradingSection += `- DEX FDV (USD): $${dexFdvUsd.toFixed(2)}\n`
    tradingSection += `- 24h Transactions: ${dexTxns24hTotal} (${dexTxns24hBuys} buys, ${dexTxns24hSells} sells)\n`
    tradingSection += `- 1h Transactions: ${dexTxnsH1Buys + dexTxnsH1Sells} (${dexTxnsH1Buys} buys, ${dexTxnsH1Sells} sells)\n`
    tradingSection += `- DEX Price Change 24h: ${dexPriceChangeH24.toFixed(2)}%\n`
    tradingSection += `- DEX Price Change 6h: ${dexPriceChangeH6.toFixed(2)}%\n`
    tradingSection += `- DEX Price Change 1h: ${dexPriceChangeH1.toFixed(2)}%\n`
    tradingSection += `- Buy/Sell Ratio 24h: ${dexTxns24hSells > 0 ? (dexTxns24hBuys / dexTxns24hSells).toFixed(2) : 'N/A'}\n`
  }

  // Build community scoring rules — adapts based on data availability
  let communityRule = ''
  if (holderDataAvailable) {
    communityRule = `- community: holder count + growth signals. <5=20, 5-20=50, 20-50=70, 50+=85, 100+=95`
  } else {
    communityRule = `- community: Since holder count is NOT available for this token, score community based on:\n` +
      `  * 24h transaction count: <10=20, 10-50=40, 50-200=55, 200-500=70, 500-1000=80, 1000+=90\n` +
      `  * Buy/sell ratio (>1 = bullish community, <0.5 = bearish exodus)\n` +
      `  * DO NOT penalize for "zero holders" — holder data is simply unavailable`
  }

  try {
    const text = await chat(
      `You are a senior crypto analyst specializing in BSC meme tokens on Four.meme.
You provide deep, data-driven analysis that is both technically accurate and easy to read.
Always respond with valid JSON only. No markdown, no preamble. Language: English.`,

      `Analyze this Four.meme BSC meme token comprehensively:

TOKEN IDENTITY
- Name: ${name} ($${shortName})
- Category: ${tag}
- Description: "${desc}"
- Contract: ${tokenAddress}
- Status: ${status}${isGraduated ? ' (GRADUATED to DEX)' : ''}
- Four.meme Native: ${isFourMemeNative ? 'Yes' : 'No (external token listed on Four.meme)'}

BONDING CURVE METRICS
- Progress: ${progressPct}% of target
- Market Cap: ${cap.toFixed(4)} BNB
- Current Price: ${price.toExponential(4)} BNB
- Max Price: ${maxPrice.toExponential(4)} BNB
- Raised Amount: ${raisedAmount.toFixed(4)} BNB (total BNB raised via bonding curve)

TRADING ACTIVITY
${tradingSection}
PRICE CHANGES
- 24h Change: ${(increase * 100).toFixed(2)}%
- 4h Change: ${(fourHourIncrease * 100).toFixed(2)}%
- 1h Change: ${(hourIncrease * 100).toFixed(2)}%

TIME
- Token age: ${ageHours != null ? ageHours + ' hours' : 'unknown'}
- Created: ${createDate}

---
Generate a complete health report as JSON. All text MUST be in English.

Rules for scoring (0–100):
- momentum: combines price change + volume relative to cap. 0=dead, 50=neutral, 100=explosive
${communityRule}
- curve: bonding curve progress. 0%=10, 1-10%=30, 10-30%=50, 30-60%=70, 60-80%=85, 80-99%=95, 100%=100
- virality: based on volume/cap ratio and price action. High ratio = high virality
- overall: weighted avg (momentum 30% + community 25% + curve 25% + virality 20%)

Respond ONLY with this exact JSON structure:
{
  "headline": "2–5 word punchy title summarizing the token's current state",
  "sentiment": "bullish" | "neutral" | "bearish" | "graduated" | "dormant",
  "overall": 0,
  "dimensions": {
    "momentum": { "score": 0, "label": "3–4 word status label", "insight": "1 sentence data-driven insight" },
    "community": { "score": 0, "label": "3–4 word status label", "insight": "1 sentence data-driven insight" },
    "curve":     { "score": 0, "label": "3–4 word status label", "insight": "1 sentence data-driven insight" },
    "virality":  { "score": 0, "label": "3–4 word status label", "insight": "1 sentence data-driven insight" }
  },
  "phase": {
    "name": "current phase name (e.g. Early Launch, Gaining Traction, Approaching Graduation, Graduated)",
    "description": "1 sentence describing what this phase means"
  },
  "alerts": [],
  "strengths": [],
  "weaknesses": [],
  "recommendation": {
    "action": "HOLD" | "PROMOTE" | "WATCH" | "GRADUATED" | "STALE",
    "reasoning": "2–3 sentence actionable advice for the token creator",
    "nextStep": "One specific concrete action to take right now"
  },
  "summary": "3–4 sentence overall narrative. Honest, crypto-native tone. End with forward-looking statement."
}

Rules:
- alerts: array of strings, 0–3 items. Only include real red flags (e.g. no volume, stuck curve)${holderDataAvailable ? '' : '. DO NOT flag "zero holders" as an alert since holder data is unavailable for this token type'}
- strengths: array of strings, 1–3 items. Genuine positives based on data
- weaknesses: array of strings, 1–3 items. Real issues based on data
- If graduated (status=TRADE), acknowledge DEX trading and adjust all analysis accordingly
- Be honest and data-driven. Don't sugarcoat if the token is struggling.`,
      1200
    )

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const result = JSON.parse(match[0])

    // Attach raw metrics for frontend display (charts, metric cards)
    result.metrics = {
      progress: progressPct,
      cap: cap.toFixed(4),
      holders: holderDataAvailable ? holders : null,
      holderDataAvailable,
      isFourMemeNative,
      volume24h: volume24h.toFixed(4),
      volumeUsd: tradingUsd.toFixed(2),
      price: price.toExponential(4),
      change24h: (increase * 100).toFixed(2),
      change4h: (fourHourIncrease * 100).toFixed(2),
      change1h: (hourIncrease * 100).toFixed(2),
      ageHours,
      status,
      isGraduated,
      tokenAddress,
      // DexScreener enriched data
      dexPriceUsd: dexPriceUsd || null,
      dexVolume24hUsd: dexVolume24hUsd || null,
      dexLiquidityUsd: dexLiquidityUsd || null,
      dexMarketCapUsd: dexMarketCapUsd || null,
      dexTxns24h: dexTxns24hTotal || null,
      dexTxns24hBuys: dexTxns24hBuys || null,
      dexTxns24hSells: dexTxns24hSells || null,
      dexBuySellRatio: dexTxns24hSells > 0 ? parseFloat((dexTxns24hBuys / dexTxns24hSells).toFixed(2)) : null,
      dexPairUrl: dex?.pairUrl || null,
    }

    res.json(result)
  } catch (e) {
    console.error('[analyze-token]', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ---------------------------------------------------------------------------
// CORS Proxy: Four.meme API
// Proxies requests from the frontend to Four.meme's API to bypass CORS.
// Also validates token creation payloads before forwarding.
// ---------------------------------------------------------------------------
const fourMemeApi = axios.create({
  baseURL: 'https://four.meme/meme-api/v1',
  timeout: 30_000,
  validateStatus: () => true,
})

/** Validates token creation body — catches name constraint errors early. */
function validateTokenCreate(bodyStr) {
  try {
    const body = JSON.parse(bodyStr)
    const { name } = body
    if (!name || typeof name !== 'string') return { error: "Mandatory parameter 'name' is required" }
    const trimmedName = String(name).trim()
    if (trimmedName.length === 0) return { error: "Mandatory parameter 'name' cannot be empty" }
    if (trimmedName.length > 20) return { error: `Mandatory parameter 'name' error, 'size must be between 0 and 20' (current: ${trimmedName.length} chars)` }
    return null
  } catch (e) { return null }
}

app.all('/api/four-meme/*', async (req, res) => {
  try {
    const path = req.params[0] || ''
    const method = req.method
    if (path === 'private/token/create' && (method === 'POST' || method === 'PUT')) {
      const validationError = validateTokenCreate(req.body.toString())
      if (validationError) return res.status(400).json(validationError)
    }
    const headers = {}
    if (req.headers['meme-web-access']) headers['meme-web-access'] = req.headers['meme-web-access']
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type']
    let response
    if (method === 'POST' || method === 'PUT') {
      response = await fourMemeApi.request({ method, url: `/${path}`, data: req.body, headers })
    } else if (method === 'GET') {
      response = await fourMemeApi.get(`/${path}`, { headers, params: req.query })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    res.status(response.status).json(response.data)
  } catch (err) {
    const status = err.response?.status || 500
    const data = err.response?.data || { error: err.message }
    console.error('[four-meme-proxy]', `${status}:`, data)
    res.status(status).json(data)
  }
})

// Ekspor app untuk Vercel
export default app

// Start server lokal jika bukan di Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✓ MemeAgent backend running on :${PORT}`)
    console.log(`  LLM Provider → ${AI_LLM_PROVIDER} (${LLM_MODEL})`)
    console.log(`  Img Provider → ${AI_IMAGE_PROVIDER} (${IMAGE_MODEL})`)
    if ((AI_LLM_PROVIDER === 'fireworks' || AI_IMAGE_PROVIDER === 'fireworks') && !FIREWORKS_API_KEY) console.warn('⚠  FIREWORKS_API_KEY not set — fireworks calls will fail')
    if ((AI_LLM_PROVIDER === 'dgrid' || AI_IMAGE_PROVIDER === 'dgrid') && !DGRID_API_KEY) console.warn('⚠  DGRID_API_KEY not set — dgrid calls will fail')
  })
}
