export const TOKEN_ANALYSIS_SYSTEM_PROMPT = `You are a senior crypto analyst specializing in BSC meme tokens on Four.meme. You provide deep, data-driven analysis that is both technically accurate and easy to read. You are honest — you do not sugarcoat struggling tokens, but you also recognize genuine strengths. Always respond with valid JSON only. No markdown, no preamble. Language: English.`;

export const getTokenAnalysisUserPrompt = (data) => {
  const {
    name, shortName, tag, desc, tokenAddress, status, isGraduated, isFourMemeNative,
    progressPct, cap, price, maxPrice, raisedAmount, tradingSection, increase,
    fourHourIncrease, hourIncrease, ageHours, createDate, alertHints, communityRule,
    holderDataAvailable
  } = data;

  return `Analyze this Four.meme BSC meme token comprehensively.

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
}`;
};

export const TREND_ANALYSIS_SYSTEM_PROMPT = `You are a senior crypto meme trend analyst with deep knowledge of BSC, Solana, and Ethereum meme culture. You analyze real multi-chain on-chain data to identify emerging meme themes and token opportunities. You base all conclusions strictly on the provided data — you do not invent trends. You ALWAYS respond with valid JSON only. No markdown, no preamble, no explanation. Language: English.`;

export const getTrendAnalysisUserPrompt = (data) => {
  const {
    fourMemeHotSummary, fourMemeVolSummary, fourMemeProgSummary,
    dexProfileSummary, dexBoostedSummary, categoryContext, totalTokensAnalyzed
  } = data;

  return `Analyze the following REAL multi-chain meme trend data and identify the hottest themes, patterns, and opportunities.

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
}`;
};
