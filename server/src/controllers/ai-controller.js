import { chat } from '../services/ai-service.js';
import { parseAIJSON, sanitizePromptInput } from '../utils/ai-utils.js';
import { fetchHotContext, fetchDexScreenerTrends, fetchFourMemeTokens, fetchDexScreener } from '../services/market-service.js';
import { AI_IMAGE_PROVIDER, IMAGE_MODEL, fireworksImgApi, dgridApi } from '../config/ai-config.js';
import * as TokenPrompts from '../prompts/token-prompts.js';
import * as AnalysisPrompts from '../prompts/analysis-prompts.js';

// Simple module-level cache for market data (60s)
let marketCache = {
  hotContext: { data: null, timestamp: 0 },
  fourMemeTokens: { data: null, timestamp: 0 },
  dexTrends: { data: null, timestamp: 0 }
};

const CACHE_TTL = 60 * 1000;

const getCachedMarketData = async (key, fetchFn) => {
  const now = Date.now();
  if (marketCache[key].data && (now - marketCache[key].timestamp < CACHE_TTL)) {
    return marketCache[key].data;
  }
  const data = await fetchFn();
  marketCache[key] = { data, timestamp: now };
  return data;
};

export const generateToken = async (req, res) => {
  const { idea, imageStyle } = req.body
  if (!idea?.trim()) return res.status(400).json({ error: 'idea is required' })

  const safeIdea = sanitizePromptInput(idea, 300)
  const safeImageStyle = sanitizePromptInput(imageStyle, 100)

  const styleSection = safeImageStyle
    ? `IMAGE STYLE (user-specified — treat as hard constraint):
  "${safeImageStyle}"
  → imageStyle field MUST reflect this exactly.
  → imagePrompt and imageNegativePrompt MUST be fully tailored to this style.
  → Do NOT override or reinterpret the user's style choice.`
    : `IMAGE STYLE (auto-select — be creative):
  → Choose the single best visual style for this concept.
  → Strong options: "bold flat vector illustration", "pixel art 8-bit", "anime chibi mascot",
    "hyper-realistic 3D render", "watercolor sketch", "glitch cyberpunk", "oil painting",
    "graffiti street art", "low-poly geometric", "neon retro synthwave".
  → Pick what makes this token MEMORABLE and SHAREABLE. Avoid generic choices.`

  try {
    const text = await chat(
      TokenPrompts.TOKEN_GENERATION_SYSTEM_PROMPT,
      TokenPrompts.getTokenGenerationUserPrompt(safeIdea, styleSection),
      1200,
    )

    res.json(parseAIJSON(text))
  } catch (e) {
    console.error('[generate-token]', e)
    res.status(500).json({ error: 'Failed to generate token concept. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────
// generateImage 
// ─────────────────────────────────────────────────────────────
export const generateImage = async (req, res) => {
  const { prompt, name, shortName, imageNegativePrompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'prompt is required' })

  const safePrompt = sanitizePromptInput(prompt, 500)
  const safeName = sanitizePromptInput(name, 50)
  const safeShortName = sanitizePromptInput(shortName, 10)
  const safeNegative = sanitizePromptInput(imageNegativePrompt, 300)

  const start = Date.now()
  try {
    const finalPrompt =
      `Crypto meme coin logo for "${safeName}" ($${safeShortName}). ${safePrompt}. ` +
      `Square format, centered composition, no text overlays.`

    const negativePrompt = safeNegative ||
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

    const duration = Date.now() - start
    console.log(`[generate-image] Success in ${duration}ms for ${safeName}`)
    res.json({ imageBase64: base64, mediaType: 'image/jpeg', dataUrl: `data:image/jpeg;base64,${base64}` })
  } catch (e) {
    const duration = Date.now() - start
    console.error(`[generate-image] Failed after ${duration}ms:`, e.message)
    let msg = e.message;
    if (e.response?.data) {
      try {
        msg = Buffer.isBuffer(e.response.data) ? Buffer.from(e.response.data).toString('utf8') : JSON.stringify(e.response.data);
      } catch (err) {
        msg = 'Error processing API error response';
      }
    }
    console.error('[generate-image]', msg)
    // For image generation, sometimes API errors are helpful for the user to see (e.g. safety filters)
    // but we'll mask generic 500s.
    const isClientError = e.response?.status >= 400 && e.response?.status < 500
    res.status(500).json({ error: isClientError ? msg : 'Failed to generate image. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────
// generateLore
export const generateLore = async (req, res) => {
  const { name, shortName, desc, tagline } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  const safeName = sanitizePromptInput(name, 50)
  const safeShortName = sanitizePromptInput(shortName, 10)
  const safeDesc = sanitizePromptInput(desc, 300)
  const safeTagline = sanitizePromptInput(tagline, 150)

  try {
    const text = await chat(
      TokenPrompts.LORE_GENERATION_SYSTEM_PROMPT,
      TokenPrompts.getLoreGenerationUserPrompt(safeName, safeShortName, safeDesc, safeTagline),
      1000,
    )
    res.json(parseAIJSON(text))
  } catch (e) {
    console.error('[generate-lore]', e)
    res.status(500).json({ error: 'Failed to generate lore. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────
// scoreToken
// ─────────────────────────────────────────────────────────────
export const scoreToken = async (req, res) => {
  const { name, shortName, desc, lore, tagline, label } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  const safeName = sanitizePromptInput(name, 50)
  const safeShort = sanitizePromptInput(shortName, 10)
  const safeDesc = sanitizePromptInput(desc, 300)
  const safeLore = sanitizePromptInput(lore, 500)
  const safeTag = sanitizePromptInput(tagline, 150)
  const safeLabel = sanitizePromptInput(label, 20)

  try {
    const hotCtx = await getCachedMarketData('hotContext', () => fetchHotContext(8));

    const trendingSection = hotCtx
      ? `━━━ CURRENTLY TRENDING ON FOUR.MEME (use for marketTiming score) ━━━
${hotCtx}

HOW TO USE THIS DATA:
→ If concept RIDES A TRENDING NARRATIVE but adds a fresh twist/angle → boost marketTiming (high demand)
→ If concept is an EXACT COPY of 2+ trending tokens (same name/mascot) → penalize marketTiming (low effort)
→ If concept is NEW/UNIQUE with no competition → score positively (first mover potential)`
      : `━━━ TRENDING DATA ━━━
No trending data available. Score marketTiming based on current crypto zeitgeist.`

    const text = await chat(
      TokenPrompts.TOKEN_SCORING_SYSTEM_PROMPT,
      TokenPrompts.getTokenScoringUserPrompt(safeName, safeShort, safeDesc, safeLore, safeTag, safeLabel, trendingSection),
      800
    )
    const result = parseAIJSON(text)

    // Ensure all scores are integers for a cleaner UI
    if (result.overall) result.overall = Math.round(result.overall)
    if (result.catchiness) result.catchiness = Math.round(result.catchiness)
    if (result.relatability) result.relatability = Math.round(result.relatability)
    if (result.memePotential) result.memePotential = Math.round(result.memePotential)
    if (result.marketTiming) result.marketTiming = Math.round(result.marketTiming)

    res.json(result)
  } catch (e) {
    console.error('[score-token]', e)
    res.status(500).json({ error: 'Failed to score token. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────
// marketingKit
// ─────────────────────────────────────────────────────────────
export const marketingKit = async (req, res) => {
  const { name, shortName, desc, lore, tagline, tokenAddress, fourMemeUrl } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  const safeName = sanitizePromptInput(name, 50)
  const safeShort = sanitizePromptInput(shortName, 10)
  const safeDesc = sanitizePromptInput(desc, 300)
  const safeLore = sanitizePromptInput(lore, 500)
  const safeTag = sanitizePromptInput(tagline, 150)
  const safeAddr = sanitizePromptInput(tokenAddress, 60)
  const safeUrl = sanitizePromptInput(fourMemeUrl, 150)

  try {
    const text = await chat(
      TokenPrompts.MARKETING_KIT_SYSTEM_PROMPT,
      TokenPrompts.getMarketingKitUserPrompt(safeName, safeShort, safeDesc, safeLore, safeTag, safeAddr, safeUrl),
      1500
    )
    res.json(parseAIJSON(text))
  } catch (e) {
    console.error('[marketing-kit]', e)
    res.status(500).json({ error: 'Failed to generate marketing kit. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────
// analyzeToken
// ─────────────────────────────────────────────────────────────
export const analyzeToken = async (req, res) => {
  const { tokenAddress, tokenData } = req.body
  if (!tokenAddress) return res.status(400).json({ error: 'tokenAddress required' })

  const safeAddress = sanitizePromptInput(tokenAddress, 64)
  const isFourMemeNative = safeAddress.toLowerCase().endsWith('4444')
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
  const drawdownFromMax = maxPrice > 0 ? ((maxPrice - price) / maxPrice * 100).toFixed(1) : null
  const volToCapRatio = cap > 0 ? (volume24h / cap).toFixed(4) : null

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
  if (volToCapRatio) tradingSection += `- Volume/Cap Ratio: ${volToCapRatio} (>0.5 = high activity, <0.05 = low)\n`
  if (drawdownFromMax) tradingSection += `- Drawdown from ATH: ${drawdownFromMax}%\n`

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
    communityRule = `- community: Based on holder count + growth signals.
  Thresholds: <5=20 | 5-20=50 | 20-50=70 | 50-100=85 | 100+=95
  Boost by 5–10 if buy/sell ratio > 1.5 (bullish community behavior)`
  } else {
    communityRule = `- community: Holder count is NOT available for this token type.
  Score based on TRANSACTION ACTIVITY only:
  24h tx count: <10=20 | 10-50=40 | 50-200=55 | 200-500=70 | 500-1000=80 | 1000+=90
  Adjust ±10 based on buy/sell ratio (>1.5 = bullish, <0.5 = bearish exodus)
  ⚠️ IMPORTANT: Do NOT flag "zero holders" as a weakness or alert — data is simply unavailable`
  }

  // Pre-compute alert conditions to guide AI
  const alertHints = []
  if (ageHours && ageHours > 24 && volume24h < 0.5) alertHints.push('Low volume for token age (possible stagnation)')
  if (progress < 0.05 && ageHours && ageHours > 48) alertHints.push('Bonding curve barely moved after 48h')
  if (dexTxns24hSells > 0 && (dexTxns24hBuys / dexTxns24hSells) < 0.4) alertHints.push('Heavy sell pressure (buy/sell ratio < 0.4)')
  if (drawdownFromMax && parseFloat(drawdownFromMax) > 60) alertHints.push('Significant drawdown from ATH (>60%)')

  try {
    const text = await chat(
      AnalysisPrompts.TOKEN_ANALYSIS_SYSTEM_PROMPT,
      AnalysisPrompts.getTokenAnalysisUserPrompt({
        name, shortName, tag, desc, tokenAddress: safeAddress, status, isGraduated, isFourMemeNative,
        progressPct, cap, price, maxPrice, raisedAmount, tradingSection, increase,
        fourHourIncrease, hourIncrease, ageHours, createDate, alertHints, communityRule,
        holderDataAvailable
      }),
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
    console.error('[analyze-token]', e)
    res.status(500).json({ error: 'Failed to analyze token. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────
// trendAnalysis
// ─────────────────────────────────────────────────────────────
export const trendAnalysis = async (req, res) => {
  try {
    console.log('[trend-analysis] Fetching multi-chain trend data...')
    const fetchStart = Date.now()

    const [fourMeme, dexScreener] = await Promise.all([
      getCachedMarketData('fourMemeTokens', fetchFourMemeTokens),
      getCachedMarketData('dexTrends', fetchDexScreenerTrends),
    ])

    const fetchMs = Date.now() - fetchStart
    console.log(`[trend-analysis] Data loaded (cached or fresh) in ${fetchMs}ms`)

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

    // Pre-compute category frequency from real data to anchor AI scoring
    const allTokens = [...fourMeme.hot, ...fourMeme.vol, ...fourMeme.prog]
    const categoryCount = allTokens.reduce((acc, t) => {
      const tag = t.tag || 'Meme'
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {})
    const categoryContext = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => `${tag}: ${count} tokens`)
      .join(', ')

    const totalTokensAnalyzed = fourMeme.hot.length + fourMeme.vol.length + fourMeme.prog.length

    const aiAnalysisStart = Date.now()
    const text = await chat(
      AnalysisPrompts.TREND_ANALYSIS_SYSTEM_PROMPT,
      AnalysisPrompts.getTrendAnalysisUserPrompt({
        fourMemeHotSummary, fourMemeVolSummary, fourMemeProgSummary,
        dexProfileSummary, dexBoostedSummary, categoryContext, totalTokensAnalyzed
      }),
      3000,
    )

    const aiMs = Date.now() - aiAnalysisStart
    console.log(`[trend-analysis] AI analysis done in ${aiMs}ms`)

    const analysis = parseAIJSON(text)

    res.json({
      ...analysis,
      // dataQuality is computed here in backend — NOT generated by AI
      dataQuality: {
        fourMemeTokensAnalyzed: totalTokensAnalyzed,
        dexScreenerProfiles: dexScreener.profiles.length,
        fetchTimeMs: fetchMs,
        aiTimeMs: aiMs,
      },
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
    console.error('[trend-analysis]', e)
    res.status(500).json({ error: 'Failed to perform trend analysis. Please try again.' })
  }
}