import axios from 'axios';

/**
 * Fetches currently trending tokens from Four.meme.
 * Used as market context for AI scoring (market timing dimension).
 */
export async function fetchHotContext(limit = 8) {
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
export async function fetchDexScreener(tokenAddress) {
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

/** Fetch ranked tokens from Four.meme (HOT, Volume, Progress) */
export async function fetchFourMemeTokens() {
  try {
    const types = ['HOT', 'VOL_DAY_1', 'PROGRESS']
    const results = await Promise.all(
      types.map(type =>
        axios.post(
          'https://four.meme/meme-api/v1/public/token/ranking',
          { pagesize: 40, type },
          { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, timeout: 8000 }
        )
      )
    )

    const [hotData, volData, progData] = results.map(r => r.data?.data || [])

    const mapToken = (t, status) => ({
      name: t.name, symbol: t.shortName || t.symbol,
      tag: t.tag || 'Meme', status,
      increase24h: parseFloat(t.dayIncrease || t.increase || 0),
      volume24h: parseFloat(t.dayTrading || t.volume || 0),
      holders: parseInt(t.hold || t.holders || 0),
      progress: parseFloat(t.progress || 0),
      cap: parseFloat(t.cap || 0),
      chain: 'BSC',
    })

    const hot = hotData.map(t => mapToken(t, 'HOT'))
    const vol = volData.map(t => mapToken(t, 'VOLUME'))
    const prog = progData.map(t => mapToken(t, 'PROGRESS'))

    console.log(`[market-service] Four.meme ranked fetched: ${hot.length} hot, ${vol.length} vol, ${prog.length} progress`)

    return { hot, vol, prog }
  } catch (e) {
    console.warn('[market-service] four.meme ranking fetch error:', e.message)
    return { hot: [], vol: [], prog: [] }
  }
}

/** Fetch hot pairs from DexScreener for BSC, Solana, Ethereum */
export async function fetchDexScreenerTrends() {
  try {
    const chains = ['bsc', 'solana', 'ethereum']
    const results = await Promise.allSettled(
      chains.map(chain =>
        axios.get(`https://api.dexscreener.com/token-profiles/latest/v1`, {
          timeout: 8000,
        }).then(r => ({ chain, data: r.data }))
      )
    )

    // Also fetch boosted tokens (trending attention signal)
    const boostedResp = await axios.get('https://api.dexscreener.com/token-boosts/top/v1', {
      timeout: 8000,
    }).catch(() => ({ data: [] }))

    const allPairs = []
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value?.data)) {
        const items = result.value.data.slice(0, 15).map(t => ({
          name: t.description || t.name || '',
          symbol: '',
          chain: (t.chainId || result.value.chain || 'unknown').toUpperCase(),
          address: t.tokenAddress,
          url: t.url,
          links: (t.links || []).map(l => l.type).join(','),
        }))
        allPairs.push(...items)
      }
    }

    const boosted = Array.isArray(boostedResp.data)
      ? boostedResp.data.slice(0, 10).map(t => ({
        name: t.description || '',
        symbol: '',
        chain: (t.chainId || '').toUpperCase(),
        address: t.tokenAddress,
        totalAmount: t.totalAmount,
        url: t.url,
      }))
      : []

    return { profiles: allPairs, boosted }
  } catch (e) {
    console.warn('[market-service] dexscreener fetch error:', e.message)
    return { profiles: [], boosted: [] }
  }
}
