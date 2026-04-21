import { chat } from '../services/ai-service.js';
import { parseAIJSON } from '../utils/ai-utils.js';
import { fetchHotContext, fetchDexScreenerTrends, fetchFourMemeTokens, fetchDexScreener } from '../services/market-service.js';
import { AI_IMAGE_PROVIDER, IMAGE_MODEL, fireworksImgApi, dgridApi } from '../config/ai-config.js';

export const generateToken = async (req, res) => {
  const { idea, imageStyle } = req.body
  if (!idea?.trim()) return res.status(400).json({ error: 'idea is required' })

  const styleSection = imageStyle?.trim()
    ? `IMAGE STYLE (user-specified — treat as hard constraint):
  "${imageStyle}"
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
      `You are a meme token creative director for BSC/Four.meme with deep knowledge of crypto culture, viral internet trends, and token branding. You specialize in concepts that are catchy, culturally resonant, and optimized for Four.meme's BNB Chain audience.
You ALWAYS respond with valid JSON only — no markdown, no preamble, no explanation. All output MUST be in English.`,

      `Create a brilliant meme token concept for BSC/Four.meme based on the user's idea below.

USER IDEA: "${idea}"

${styleSection}

━━━ FIELD RULES ━━━

IDENTITY:
- name: catchy, memorable, max 20 chars, NO emojis, English only
- shortName: 3–6 uppercase letters only (the ticker symbol)
- label: exactly one of: Meme | AI | Defi | Games | Infra | De-Sci | Social | Depin | Charity | Others

COPY:
- desc: funny, viral, crypto-native description. Max 200 chars. English only.
- tagline: punchy one-liner under 100 chars. MUST include $SYMBOL. English only.

VISUAL (all three must be internally consistent with imageStyle):
- imageStyle: one descriptive phrase defining the art direction
- imagePrompt: vivid, detailed generation prompt tailored to imageStyle. Include:
  main subject/character, color palette, lighting, composition, background, key visual details.
  Do NOT use generic descriptions — every detail must reinforce the chosen style.
- imageNegativePrompt: what to AVOID. Target the specific failure modes of the chosen style.
  Always include: "text, watermark, low quality, deformed". Add style-specific issues.

━━━ FAILURE MODES TO AVOID ━━━
- Do NOT use emojis anywhere in name, desc, tagline, or imageStyle
- If user idea is not in English, translate the INTENT (not literal words) before generating
- imagePrompt must NOT be a generic description — it must be styled to imageStyle

━━━ OUTPUT FORMAT ━━━
Respond with ONLY this JSON:
{
  "name": "...",
  "shortName": "...",
  "desc": "...",
  "label": "...",
  "imageStyle": "...",
  "imagePrompt": "...",
  "imageNegativePrompt": "...",
  "tagline": "..."
}`,
      1200,
    )

    res.json(parseAIJSON(text))
  } catch (e) {
    console.error('[generate-token]', e.message)
    res.status(500).json({ error: e.message })
  }
}

// ─────────────────────────────────────────────────────────────
// generateImage 
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// generateLore
export const generateLore = async (req, res) => {
  const { name, shortName, desc, tagline } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  try {
    const text = await chat(
      `You are a crypto Twitter copywriter and meme lore writer with 5 years on Crypto Twitter. You write in the authentic voice of CT: irreverent, chaotic, self-aware, and deeply fluent in meme culture. You avoid corporate tone, buzzwords, and generic hype. You ALWAYS respond with valid JSON only — no markdown, no preamble. All output in English.`,

      `Create viral social content for this BSC/Four.meme meme token.

TOKEN:
- Name: ${name} ($${shortName})
- Description: ${desc}
- Tagline: ${tagline || ''}

━━━ CONTENT RULES ━━━

[tweet]
- Max 280 chars. Must include $${shortName}.
- Include 2–3 hashtags (put them at the end, not scattered).
- Voice: punchy, authentic CT energy. Think: announcement that feels like alpha, not an ad.
- GOOD TONE: "ngl $PEPE just woke up. this is the one ser 🐸"
- BAD TONE: "We are excited to announce the launch of our revolutionary token!"
- Do NOT use: "revolutionary", "innovative", "join us", "don't miss out"

[lore]
- 2–3 sentences. The absurd/funny origin story of this token.
- Must feel specific to THIS token's concept, not generic crypto lore.
- Format: Past tense narrative. Drop reader in mid-chaos. End with a twist or punchline.
- GOOD EXAMPLE: "Born during a 3am Binance maintenance window, the dev was supposed to be asleep. One accidental wallet connect later, $DOGE had a cousin. The whitepaper was a grocery receipt."
- BAD EXAMPLE: "This token was created by a passionate community who believes in decentralization."

[useCase]
- 1 sentence. Absurd but internally logical "utility".
- Must be specific to $${shortName}'s theme. The humor comes from commitment to the bit.
- GOOD EXAMPLE: "Stake $SNEK to earn governance rights over which crypto influencers get ratio'd next."
- BAD EXAMPLE: "Used for payments and governance within the ecosystem."

━━━ OUTPUT FORMAT ━━━
{ "tweet": "...", "lore": "...", "useCase": "..." }`,
      1000,
    )
    res.json(parseAIJSON(text))
  } catch (e) {
    console.error('[generate-lore]', e.message)
    res.status(500).json({ error: e.message })
  }
}

// ─────────────────────────────────────────────────────────────
// scoreToken
// ─────────────────────────────────────────────────────────────
export const scoreToken = async (req, res) => {
  const { name, shortName, desc, lore, tagline, label } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  try {
    const hotCtx = await fetchHotContext(8)

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
      `You are a top-tier crypto trend researcher and 'gem scouter' for BSC/Four.meme. Your goal is to identify tokens with true moonshot potential. You value creative execution and perfect market timing. 
A score of 50 is mediocre/stale, 75 is high-potential, and 90+ is a top-tier 'alpha' play. Respond ONLY with valid JSON. Language: English.`,

      `Score this meme token concept for Four.meme (BNB Chain) viral potential.

TOKEN:
- Name: ${name} ($${shortName})
- Category: ${label || 'Meme'}
- Description: ${desc}
- Lore: ${lore || 'none provided'}
- Tagline: ${tagline || 'none provided'}

${trendingSection}

━━━ SCORING RUBRIC (0–100 each) ━━━

catchiness (20% weight):
  - Name memorability and "earworm" quality.
  - 40 = generic | 70 = good | 90+ = iconic

relatability (20% weight):
  - Connection to crypto culture or current internet zeitgeist.
  - 40 = niche | 70 = CT-friendly | 90+ = universal appeal

memePotential (30% weight):
  - "Memetic thickness": How easily can people make 100 variations of this?
  - Visual potential and spreadability.

marketTiming (30% weight):
  - **CRITICAL**: Use the trending data above. 
  - If it hits a local/global trend detected in the data → Score 85-100.
  - If it's a stale/dead theme → Score < 40.

overall: weighted average (catchiness×0.20 + relatability×0.20 + memePotential×0.30 + marketTiming×0.30)
  - **BONUS**: If the token shows high "Narrative Congruence" (perfectly fits a hot trend), boost the final score by 2–5 points.
  - Give scores that reflect the REAL hype potential on BSC. High-trend ideas SHOULD score 75-90+.

━━━ ALSO GENERATE ━━━
- verdict: 1–2 sentence honest assessment in crypto-native tone. Max 120 chars total. No sugarcoating.
- tips: exactly 3 short, SPECIFIC, actionable improvement suggestions. Max 60 chars each.
  - BAD tip: "Improve the name" 
  - GOOD tip: "Add animal mascot angle to boost memePotential"

━━━ OUTPUT FORMAT ━━━
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
    const result = parseAIJSON(text)

    // Ensure all scores are integers for a cleaner UI
    if (result.overall) result.overall = Math.round(result.overall)
    if (result.catchiness) result.catchiness = Math.round(result.catchiness)
    if (result.relatability) result.relatability = Math.round(result.relatability)
    if (result.memePotential) result.memePotential = Math.round(result.memePotential)
    if (result.marketTiming) result.marketTiming = Math.round(result.marketTiming)

    res.json(result)
  } catch (e) {
    console.error('[score-token]', e.message)
    res.status(500).json({ error: e.message })
  }
}

// ─────────────────────────────────────────────────────────────
// marketingKit
// ─────────────────────────────────────────────────────────────
export const marketingKit = async (req, res) => {
  const { name, shortName, desc, lore, tagline, tokenAddress, fourMemeUrl } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  try {
    const text = await chat(
      `You are a crypto marketing expert for BSC meme tokens on Four.meme. You write viral Crypto Twitter and Telegram content that sounds authentic — not like a press release. You know the difference between content that gets retweeted and content that gets ignored. Respond ONLY with valid JSON — no markdown, no preamble. All text in English.`,

      `Create a complete marketing kit for this LIVE BSC meme token on Four.meme.

TOKEN CONTEXT:
- Name: ${name} ($${shortName})
- Description: ${desc}
- Lore: ${lore || 'none'}
- Tagline: ${tagline || 'none'}
- Contract: ${tokenAddress || 'TBA'}
- Four.meme Link: ${fourMemeUrl || 'https://four.meme'}

━━━ TWEET CONTENT RULES ━━━
All tweets: max 280 chars, must include $${shortName}, English only, hashtags at END.

[hype] — Launch announcement with max energy
  Tone: Feels like you just found a gem, not selling something. 2–3 emojis.
  GOOD: "ser... $SNEK just dropped on Four.meme and it already got 50 holders in 10min 👀🐍 this is the one"
  BAD: "We are thrilled to announce the official launch of $SNEK on BNB Chain!"

[alpha] — Mysterious insider feel
  Tone: "few understand this" energy. Confident without explaining. 0–1 emojis.
  GOOD: "been watching $SNEK since genesis block. charts don't lie. do your own research ser 🫡"
  BAD: "Our token has great fundamentals and growth potential."

[community] — Invite & WAGMI energy
  Tone: Warm, inclusive, cultish in a fun way. 1–2 emojis.
  GOOD: "the $SNEK holders are built different fr. come vibe with us before we moon 🐍"
  BAD: "Join our growing community and be part of our journey!"

[fud_response] — Confident, unbothered reply to skeptics
  Tone: Not defensive. Amused. One rhetorical question or dismissive closer. 0–1 emojis.
  GOOD: "$SNEK fudders really out here while we +200% 💀 stay poor ser"
  BAD: "We understand your concerns and want to assure you our project is legitimate."

━━━ TELEGRAM CONTENT RULES ━━━

[announcement] — Formal launch post for Telegram groups
  Structure: Hook line → Token details → Contract → Link → Call to action
  Length: 3–4 sentences. Include full contract address and Four.meme URL.
  Tone: Excited but legible. This will be copy-pasted into 10 groups.

[community] — Welcome message for new holders
  Tone: Casual, fun, a bit chaotic. Makes newcomers feel like they found a secret club.
  Length: 2–3 sentences. End with something quotable or funny.

━━━ HASHTAG RULES ━━━
Exactly 8 strings without # symbol. Mix formula:
  - 2 BSC/chain general tags (e.g. BNBChain, BSC)
  - 2 meme/crypto culture tags (e.g. Memecoin, CryptoTwitter)  
  - 2 Four.meme platform tags (e.g. FourMeme, BSCGems)
  - 2 token-specific tags based on $${shortName}'s theme/concept

━━━ OUTPUT FORMAT (do not change this structure) ━━━
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

// ─────────────────────────────────────────────────────────────
// analyzeToken
// ─────────────────────────────────────────────────────────────
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
      `You are a senior crypto analyst specializing in BSC meme tokens on Four.meme. You provide deep, data-driven analysis that is both technically accurate and easy to read. You are honest — you do not sugarcoat struggling tokens, but you also recognize genuine strengths. Always respond with valid JSON only. No markdown, no preamble. Language: English.`,

      `Analyze this Four.meme BSC meme token comprehensively.

━━━ TOKEN IDENTITY ━━━
- Name: ${name} ($${shortName})
- Category: ${tag}
- Description: "${desc}"
- Contract: ${tokenAddress}
- Status: ${status}${isGraduated ? ' (GRADUATED to DEX — now trading on open market)' : ''}
- Four.meme Native: ${isFourMemeNative ? 'Yes' : 'No (external token listed on Four.meme)'}

━━━ BONDING CURVE METRICS ━━━
- Progress: ${progressPct}% of graduation target
- Market Cap: ${cap.toFixed(4)} BNB
- Current Price: ${price.toExponential(4)} BNB
- Max Price (ATH): ${maxPrice.toExponential(4)} BNB
- Raised Amount: ${raisedAmount.toFixed(4)} BNB

━━━ TRADING ACTIVITY ━━━
${tradingSection}
━━━ PRICE CHANGES ━━━
- 24h: ${(increase * 100).toFixed(2)}%
- 4h: ${(fourHourIncrease * 100).toFixed(2)}%
- 1h: ${(hourIncrease * 100).toFixed(2)}%

━━━ TOKEN AGE ━━━
- Age: ${ageHours != null ? ageHours + ' hours old' : 'unknown'}
- Created: ${createDate}

${alertHints.length > 0 ? `━━━ PRE-FLAGGED CONDITIONS (verify and include if accurate) ━━━\n${alertHints.map(h => `⚠️ ${h}`).join('\n')}` : ''}

━━━ SCORING RUBRIC ━━━

momentum (30% weight):
  Combines price change velocity + volume relative to market cap.
  0=dead/no activity | 30=barely alive | 50=neutral | 70=active | 85=trending | 100=explosive

${communityRule}

curve (25% weight):
  Bonding curve graduation progress.
  0%=10 | 1-10%=30 | 10-30%=50 | 30-60%=70 | 60-80%=85 | 80-99%=95 | 100%=100 (graduated)

virality (20% weight):
  Volume/Cap ratio + price action intensity. High ratio = organic interest.
  ratio<0.05=20 | 0.05-0.2=40 | 0.2-0.5=60 | 0.5-1=75 | 1+=90

overall: weighted avg (momentum×0.30 + community×0.25 + curve×0.25 + virality×0.20)
  Calculate precisely.

━━━ CONTENT QUALITY RULES ━━━

alerts (0–3 items):
  ONLY include if condition is clearly present in the data:
  ✓ "Volume stagnant: only X BNB traded in 24h despite Y hours of age"
  ✓ "Sell pressure: buy/sell ratio at X (below healthy 1.0 threshold)"
  ✓ "Curve stalled: X% progress after Y hours with minimal movement"
  ✗ Do NOT include: vague warnings, speculation, or unavailable data issues${holderDataAvailable ? '' : '\n  ✗ Do NOT flag zero/missing holder count — this data is not tracked for this token type'}

strengths (1–3 items): Must be grounded in actual data points, not generic praise.
  ✗ BAD: "Active community" (if you can't prove it from data)
  ✓ GOOD: "Strong buy pressure: 3.2 buy/sell ratio over 24h"

weaknesses (1–3 items): Real issues backed by numbers.
  ✗ BAD: "Could improve marketing"
  ✓ GOOD: "Volume/cap ratio of 0.02 suggests limited organic trading interest"

${isGraduated ? `GRADUATED TOKEN NOTE:
  This token has graduated to DEX trading. Adjust ALL analysis to reflect open market dynamics:
  - curve score = 100 (graduation achieved)
  - Focus momentum/community/virality on DEX volume, liquidity, and price action
  - recommendation should reflect post-graduation phase (HOLD, PROMOTE, or WATCH for DEX performance)` : ''}

━━━ OUTPUT FORMAT ━━━
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
    "description": "1 sentence describing what this phase means for this specific token"
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
}`,
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
    console.error('[analyze-token]', e.message)
    res.status(500).json({ error: e.message })
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
      fetchFourMemeTokens(),
      fetchDexScreenerTrends(),
    ])

    const fetchMs = Date.now() - fetchStart
    console.log(`[trend-analysis] Data fetched in ${fetchMs}ms`)

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
      `You are a senior crypto meme trend analyst with deep knowledge of BSC, Solana, and Ethereum meme culture. You analyze real multi-chain on-chain data to identify emerging meme themes and token opportunities. You base all conclusions strictly on the provided data — you do not invent trends. You ALWAYS respond with valid JSON only. No markdown, no preamble, no explanation. Language: English.`,

      `Analyze the following REAL multi-chain meme trend data and identify the hottest themes, patterns, and opportunities.

━━━ DATA SOURCES & HOW TO USE THEM ━━━
→ Four.meme HOT: tokens trending by price increase — reveals what's gaining momentum NOW
→ Four.meme VOL: tokens by trading volume — reveals where real money is moving
→ Four.meme PROG: tokens near graduation — reveals what's about to break out
→ DexScreener PROFILES: tokens paying for featured profiles — reveals marketing spend & confidence
→ DexScreener BOOSTED: tokens with paid boosts — highest-conviction plays by teams

━━━ FOUR.MEME HOT TOKENS (BSC — sorted by trending) ━━━
${fourMemeHotSummary || 'No data available'}

━━━ FOUR.MEME HIGH VOLUME TOKENS (BSC — 24h volume) ━━━
${fourMemeVolSummary || 'No data available'}

━━━ FOUR.MEME HIGH PROGRESS TOKENS (BSC — near graduation) ━━━
${fourMemeProgSummary || 'No data available'}

━━━ DEXSCREENER FEATURED PROFILES (BSC + SOL + ETH) ━━━
${dexProfileSummary || 'No data available'}

━━━ DEXSCREENER TOP BOOSTED TOKENS ━━━
${dexBoostedSummary || 'No data available'}

━━━ CATEGORY FREQUENCY FROM RAW DATA ━━━
(Use this to calibrate categoryHeatmap scores)
${categoryContext || 'No category data'}
Total tokens in dataset: ${totalTokensAnalyzed}

━━━ ANALYSIS RULES ━━━

themes (exactly 5, sorted by heatScore DESC):
  - Must be grounded in actual token names/categories from the data above
  - Do NOT invent themes not present in the data
  - exampleTokens: use ACTUAL names from the data, not made-up names
  - heatScore: 0=not present | 40=minor | 60=present | 75=notable | 90=dominant

tokenIdea:
  - MUST be inspired by patterns in the ACTUAL data above, not generic crypto trends
  - reasoning must cite specific tokens or patterns from the data as justification

categoryHeatmap:
  - Score based on the Category Frequency data above
  - Most frequent category should score highest
  - Categories with 0 tokens in data should score 20–30 (baseline noise)

risingPatterns (exactly 3):
  - Must describe patterns visible across MULTIPLE data sources above
  - strength: "strong" only if visible in 2+ data sources

topOpportunities (exactly 3):
  - Specific, actionable, based on gaps or momentum in the data
  - urgency "high" only if tokens in that niche are already near graduation

━━━ OUTPUT FORMAT ━━━
{
  "marketPulse": {
    "sentiment": "bullish" | "bearish" | "neutral",
    "sentimentScore": 0-100,
    "summary": "2 sentence market condition summary grounded in the data",
    "hotChain": "BSC" | "Solana" | "Ethereum",
    "hotChainReason": "1 sentence citing specific data evidence"
  },
  "themes": [
    {
      "name": "Theme name",
      "emoji": "single relevant emoji",
      "heatScore": 0-100,
      "momentum": "rising" | "stable" | "cooling",
      "description": "2 sentence explanation citing evidence from the data",
      "chains": ["BSC", "Solana", "Ethereum"],
      "exampleTokens": ["actual token name from data", "actual token name from data"],
      "opportunity": "1 sentence specific opportunity for new token creators"
    }
  ],
  "tokenIdea": {
    "name": "Catchy token name (max 20 chars, no emoji, English only)",
    "symbol": "3-6 UPPERCASE letters",
    "theme": "Which theme this belongs to",
    "tagline": "Punchy one-liner max 80 chars, include $SYMBOL",
    "desc": "Why this token fits current trends, max 150 chars",
    "reasoning": "2-3 sentence explanation citing SPECIFIC tokens or data patterns from above"
  },
  "risingPatterns": [
    {
      "pattern": "Short pattern name",
      "description": "1 sentence with data evidence",
      "strength": "strong" | "moderate" | "weak"
    }
  ],
  "categoryHeatmap": {
    "Meme": 0-100, "AI": 0-100, "Games": 0-100, "Political": 0-100, "Animal": 0-100, "Food": 0-100, "DeFi": 0-100, "Social": 0-100
  },
  "topOpportunities": [
    {
      "title": "Short opportunity title",
      "chain": "BSC" | "Solana" | "Ethereum",
      "reason": "1 sentence citing data evidence",
      "urgency": "high" | "medium" | "low"
    }
  ]
}`,
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
    console.error('[trend-analysis]', e.message)
    res.status(500).json({ error: e.message })
  }
}