import { chat } from '../services/ai-service.js';
import { parseAIJSON } from '../utils/ai-utils.js';
import { fetchHotContext, fetchDexScreenerTrends, fetchFourMemeTokens, fetchDexScreener } from '../services/market-service.js';
import { AI_IMAGE_PROVIDER, IMAGE_MODEL, fireworksImgApi, dgridApi } from '../config/ai-config.js';

export const generateToken = async (req, res) => {
  const { idea, imageStyle } = req.body
  if (!idea?.trim()) return res.status(400).json({ error: 'idea is required' })

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

    res.json(parseAIJSON(text))
  } catch (e) {
    console.error('[generate-token]', e.message)
    res.status(500).json({ error: e.message })
  }
}

export const generateImage = async (req, res) => {
  const { prompt, name, shortName, imageNegativePrompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'prompt is required' })
  try {
    const finalPrompt =
      `Crypto meme coin logo for "${name}" ($${shortName}). ${prompt}. ` +
      `Square format, centered composition, no text overlays.`

    const negativePrompt = imageNegativePrompt ||
      'text, watermark, blurry, low quality, ugly, deformed, extra limbs, bad anatomy, signature, border, frame'

    let base64;
    if (AI_IMAGE_PROVIDER === 'dgrid') {
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
}

export const generateLore = async (req, res) => {
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
      1000,
    )
    res.json(parseAIJSON(text))
  } catch (e) {
    console.error('[generate-lore]', e.message)
    res.status(500).json({ error: e.message })
  }
}

export const scoreToken = async (req, res) => {
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
      800
    )
    res.json(parseAIJSON(text))
  } catch (e) {
    console.error('[score-token]', e.message)
    res.status(500).json({ error: e.message })
  }
}

export const marketingKit = async (req, res) => {
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
      1500
    )
    res.json(parseAIJSON(text))
  } catch (e) {
    console.error('[marketing-kit]', e.message)
    res.status(500).json({ error: e.message })
  }
}

export const analyzeToken = async (req, res) => {
  const { tokenAddress, tokenData } = req.body
  if (!tokenAddress) return res.status(400).json({ error: 'tokenAddress required' })

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

  let dex = null
  if (isGraduated || !isFourMemeNative) {
    dex = await fetchDexScreener(tokenAddress)
  }

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
      `You are a senior crypto analyst specializing in BSC meme tokens on Four.meme. You provide deep, data-driven analysis that is both technically accurate and easy to read. Always respond with valid JSON only. No markdown, no preamble. Language: English.`,
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
      1500
    )

    const result = parseAIJSON(text)

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
}

export const trendAnalysis = async (req, res) => {
  try {
    console.log('[trend-analysis] Fetching multi-chain trend data...')
    const fetchStart = Date.now()

    // Fetch all data sources in parallel
    const [fourMeme, dexScreener] = await Promise.all([
      fetchFourMemeTokens(),
      fetchDexScreenerTrends(),
    ])

    const fetchMs = Date.now() - fetchStart
    console.log(`[trend-analysis] Data fetched in ${fetchMs}ms`)

    // Raw data summary for AI
    const fourMemeHotSummary = fourMeme.hot.slice(0, 10).map(t =>
      `${t.name}($${t.symbol})[${t.tag}] +${(t.increase24h * 100).toFixed(1)}% vol:${t.volume24h.toFixed(2)}BNB holders:${t.holders} progress:${(t.progress * 100).toFixed(0)}%`
    ).join('\n')

    const fourMemeVolSummary = fourMeme.vol.slice(0, 10).map(t =>
      `${t.name}($${t.symbol})[${t.tag}] VOL:${t.volume24h.toFixed(2)}BNB holders:${t.holders} progress:${(t.progress * 100).toFixed(0)}%`
    ).join('\n')

    const fourMemeProgSummary = fourMeme.prog.slice(0, 10).map(t =>
      `${t.name}($${t.symbol})[${t.tag}] PROGRESS:${(t.progress * 100).toFixed(0)}% holders:${t.holders}`
    ).join('\n')


    const dexProfileSummary = dexScreener.profiles.slice(0, 12).map(p =>
      `[${p.chain}] ${p.name || p.address?.slice(0, 8)}`
    ).join('\n')

    const dexBoostedSummary = dexScreener.boosted.slice(0, 6).map(b =>
      `[${b.chain}] ${b.name || b.address?.slice(0, 8)} boost:${b.totalAmount}`
    ).join('\n')

    const marketContext = 'Market data analyzed via Four.meme and DexScreener patterns.'

    const aiAnalysisStart = Date.now()
    const text = await chat(
      `You are a senior crypto meme trend analyst with deep knowledge of BSC, Solana, and Ethereum meme culture. You analyze real multi-chain on-chain data to identify emerging meme themes and token opportunities. You ALWAYS respond with valid JSON only. No markdown, no preamble, no explanation. Language: English.`,
      `Analyze the following REAL multi-chain meme trend data fetched right now and identify the hottest themes, patterns, and opportunities.

=== MARKET CONTEXT ===
${marketContext}

=== FOUR.MEME HOT TOKENS (BSC, sorted by trending) ===
${fourMemeHotSummary || 'No data'}

=== FOUR.MEME HIGH VOLUME TOKENS (BSC, 24h volume) ===
${fourMemeVolSummary || 'No data'}

=== FOUR.MEME HIGH PROGRESS TOKENS (BSC, near graduation) ===
${fourMemeProgSummary || 'No data'}


=== DEXSCREENER FEATURED PROFILES (BSC + SOL + ETH) ===
${dexProfileSummary || 'No data'}

=== DEXSCREENER TOP BOOSTED TOKENS (High attention) ===
${dexBoostedSummary || 'No data'}

---
Based on ALL the data above, generate a comprehensive meme trend analysis.

Respond ONLY with this exact JSON:
{
  "marketPulse": {
    "sentiment": "bullish" | "bearish" | "neutral",
    "sentimentScore": 0-100,
    "summary": "2 sentence market condition summary",
    "hotChain": "BSC" | "Solana" | "Ethereum",
    "hotChainReason": "1 sentence why this chain is hottest right now"
  },
  "themes": [
    {
      "name": "Theme name (e.g. 'AI Agents', 'Animal Memes', 'Political')",
      "emoji": "single relevant emoji",
      "heatScore": 0-100,
      "momentum": "rising" | "stable" | "cooling",
      "description": "2 sentence explanation of why this theme is trending",
      "chains": ["BSC", "Solana", "Ethereum"],
      "exampleTokens": ["token1", "token2"],
      "opportunity": "1 sentence specific opportunity for new token creators"
    }
  ],
  "tokenIdea": {
    "name": "Catchy token name (max 20 chars, no emoji, English only)",
    "symbol": "3-6 UPPERCASE letters",
    "theme": "Which theme this belongs to",
    "tagline": "Punchy one-liner max 80 chars, include $SYMBOL",
    "desc": "Why this token fits current trends, max 150 chars",
    "reasoning": "2-3 sentence explanation of why this specific idea is hot RIGHT NOW based on the trend data"
  },
  "risingPatterns": [
    {
      "pattern": "Short pattern name",
      "description": "1 sentence",
      "strength": "strong" | "moderate" | "weak"
    }
  ],
  "categoryHeatmap": {
    "Meme": 0-100, "AI": 0-100, "Games": 0-100, "Political": 0-100, "Animal": 0-100, "Food": 0-100, "DeFi": 0-100, "Social": 0-100
  },
  "topOpportunities": [
    {
      "title": "Short opportunity title", "chain": "BSC" | "Solana" | "Ethereum", "reason": "1 sentence why", "urgency": "high" | "medium" | "low"
    }
  ],
  "dataQuality": {
    "fourMemeTokensAnalyzed": ${fourMeme.hot.length + fourMeme.vol.length + fourMeme.prog.length},
    "dexScreenerProfiles": ${dexScreener.profiles.length},
    "fetchTimeMs": ${fetchMs}
  }
}

Rules:
- themes: exactly 5 themes, sorted by heatScore descending
- risingPatterns: exactly 3 patterns
- topOpportunities: exactly 3 opportunities  
- tokenIdea: must be inspired by the ACTUAL trending data, not generic
- All text in English only
- Be specific and data-driven, not generic`,
      3000,
    )

    const aiMs = Date.now() - aiAnalysisStart
    console.log(`[trend-analysis] AI analysis done in ${aiMs}ms`)

    const analysis = parseAIJSON(text)

    // Attach raw data for frontend display
    res.json({
      ...analysis,
      rawData: {
        fourMeme: {
          hot: fourMeme.hot.slice(0, 8),
          vol: fourMeme.vol.slice(0, 8),
          prog: fourMeme.prog.slice(0, 8),
        },
        dexScreener: {
          boosted: dexScreener.boosted.slice(0, 6),
          profiles: dexScreener.profiles.slice(0, 8),
        },
      },
      fetchedAt: new Date().toISOString(),
      fetchTimeMs: fetchMs,
      aiTimeMs: aiMs,
    })
  } catch (e) {
    console.error('[trend-analysis]', e.message)
    res.status(500).json({ error: e.message })
  }
}
