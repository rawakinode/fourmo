/**
 * fourmeme.js
 *
 * API client for Four.meme platform (https://four.meme).
 * Handles authentication, token creation, image upload, and
 * public token queries against the Four.meme REST API on BSC.
 *
 * In development, requests go through Vite's proxy to bypass CORS.
 * In production, the client hits the Four.meme API directly.
 */

import axios from 'axios'

// Resolve API base depending on environment.
// Dev uses Vite proxy path; production hits the API directly.
const isDev = import.meta.env.DEV
const prodUrl = 'https://four.meme/meme-api/v1'
const devUrl  = '/api/four-meme'
const apiBaseUrl = import.meta.env.VITE_FOUR_MEME_API_BASE_URL || (isDev ? devUrl : prodUrl)

// CDN base for resolving relative image paths returned by the API (e.g. /market/xxx.png)
export const FOUR_MEME_CDN = 'https://static.four.meme'

/**
 * Resolves a potentially relative image path to a full URL.
 * If the image is already an absolute URL, returns it as-is.
 */
export function resolveImg(img) {
  if (!img) return ''
  if (img.startsWith('http')) return img
  return `${FOUR_MEME_CDN}${img.startsWith('/') ? '' : '/'}${img}`
}

const api = axios.create({ baseURL: apiBaseUrl, timeout: 30_000 })

/**
 * Unwraps the Four.meme API envelope format: { code, data, msg }.
 * Throws with a descriptive message if the response indicates an error.
 */
function unwrap(res, label) {
  const { code, data, msg } = res.data
  if (code !== '0' && code !== 0) {
    throw new Error(`[${label}] ${msg || JSON.stringify(res.data)}`)
  }
  return data
}

/** Safe number coercion with fallback for non-finite values. */
function toNumber(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Normalizes a value to a trimmed string array. Accepts arrays or comma-separated strings. */
function normalizeArray(value) {
  if (value == null) return undefined
  if (Array.isArray(value)) return value.map(s => String(s).trim()).filter(Boolean)
  return String(value).split(',').map(s => s.trim()).filter(Boolean)
}

// ---------------------------------------------------------------------------
// Auth Flow
// ---------------------------------------------------------------------------
// The login flow is a 3-step process:
//   1. getNonce()  — request a nonce for the wallet address
//   2. login()     — sign the nonce with MetaMask, exchange for access_token
//   3. getUserInfo() / getUserProfile() — fetch user data with the token

/** Step 1: Request a nonce for wallet login signing. */
export async function getNonce(address) {
  const res = await api.post('/private/user/nonce/generate', {
    accountAddress: address,
    verifyType: 'LOGIN',
    networkCode: 'BSC',
  })
  return unwrap(res, 'getNonce')
}

/** Step 2: Exchange signed nonce for an access_token. */
export async function login(address, signature) {
  const res = await api.post('/private/user/login/dex', {
    region: 'WEB',
    langType: 'EN',
    loginIp: '',
    inviteCode: '',
    verifyInfo: { address, networkCode: 'BSC', signature, verifyType: 'LOGIN' },
    walletName: 'MetaMask',
  })
  return unwrap(res, 'login') // returns access_token string
}

/** Step 3a: Fetch logged-in user info (userId, address, etc.). */
export async function getUserInfo(accessToken) {
  const res = await api.get('/private/user/info', {
    headers: { 'meme-web-access': accessToken },
  })
  return unwrap(res, 'getUserInfo')
}

/** Step 3b: Fetch user profile with token creation stats. */
export async function getUserProfile(accessToken, userId) {
  const res = await api.get(`/private/user/token/detail?userId=${userId}`, {
    headers: { 'meme-web-access': accessToken },
  })
  return unwrap(res, 'getUserProfile')
}

// ---------------------------------------------------------------------------
// My Tokens (authenticated)
// ---------------------------------------------------------------------------

/**
 * Fetches all tokens created by the authenticated user.
 * Supports sorting, filtering by name/symbol, and pagination.
 */
export async function getMyTokens(accessToken, userId, {
  orderBy   = 'CREATE_DATE',
  sorted    = 'DESC',
  tokenName = '',
  pageIndex = 1,
  pageSize  = 300,
  symbol    = '',
} = {}) {
  const params = new URLSearchParams({
    userId,
    orderBy,
    sorted,
    tokenName,
    pageIndex,
    pageSize,
    symbol,
  })
  const res = await api.get(`/private/user/token/create/list?${params}`, {
    headers: { 'meme-web-access': accessToken },
  })
  return unwrap(res, 'getMyTokens') ?? []
}

// ---------------------------------------------------------------------------
// Token Creation Flow
// ---------------------------------------------------------------------------

/** Uploads an image blob to Four.meme and returns the hosted image URL. */
export async function uploadImage(accessToken, imageBlob, filename = 'token.png') {
  const form = new FormData()
  form.append('file', imageBlob, filename)
  const res = await api.post('/private/token/upload', form, {
    headers: { 'meme-web-access': accessToken },
  })
  return unwrap(res, 'uploadImage')
}

/**
 * Fetches the public bonding curve config (raised token parameters).
 * Returns the BNB config if available, otherwise the first published config.
 */
export async function getPublicConfig() {
  const res = await api.get('/public/config')
  const symbols = unwrap(res, 'getPublicConfig')
  const published = symbols.filter(c => c.status === 'PUBLISH')
  const list = published.length > 0 ? published : symbols
  return list.find(c => c.symbol === 'BNB') ?? list[0]
}

/**
 * Registers a new token via the Four.meme API.
 * Validates name constraints before sending (max 20 chars, non-empty).
 * Returns { createArg, signature } — both Base64-encoded, used for the
 * on-chain createToken() call on TokenManager2.
 */
export async function createTokenAPI(accessToken, {
  name, shortName, desc, imgUrl, label, raisedToken,
  webUrl, twitterUrl, telegramUrl, tokenTaxInfo,
}) {
  // Name validation (matches Four.meme's server-side rules)
  if (!name || typeof name !== 'string') {
    throw new Error(`Mandatory parameter 'name' is required`)
  }
  const trimmedName = String(name).trim()
  if (trimmedName.length === 0) {
    throw new Error(`Mandatory parameter 'name' cannot be empty`)
  }
  if (trimmedName.length > 20) {
    throw new Error(`Mandatory parameter 'name' error, 'size must be between 0 and 20' (current: ${trimmedName.length} chars)`)
  }

  if (!raisedToken || typeof raisedToken !== 'object') {
    throw new Error('createTokenAPI requires raisedToken from getPublicConfig()')
  }
  const body = {
    name,
    shortName,
    desc,
    totalSupply:  toNumber(raisedToken.totalAmount,  1_000_000_000),
    raisedAmount: toNumber(raisedToken.totalBAmount, 24),
    saleRate:     toNumber(raisedToken.saleRate,     0.8),
    reserveRate:  0,
    imgUrl,
    raisedToken,
    launchTime:   Date.now(),
    funGroup:     false,
    label,
    lpTradingFee: 0.0025,
    preSale:      '0',
    clickFun:     false,
    symbol:       raisedToken.symbol,
    dexType:      'PANCAKE_SWAP',
    rushMode:     false,
    onlyMPC:      false,
    feePlan:      false,
  }
  if (webUrl)       body.webUrl       = webUrl
  if (twitterUrl)   body.twitterUrl   = twitterUrl
  if (telegramUrl)  body.telegramUrl  = telegramUrl
  if (tokenTaxInfo) body.tokenTaxInfo = tokenTaxInfo

  const res = await api.post('/private/token/create', body, {
    headers: { 'meme-web-access': accessToken },
  })
  return unwrap(res, 'createTokenAPI') // { createArg, signature }
}

// ---------------------------------------------------------------------------
// Public Token Queries (no auth needed)
// ---------------------------------------------------------------------------

/** Searches public token listings with filters for type, status, tags, etc. */
export async function getTokenList({
  type = 'HOT', listType = 'NOR',
  pageIndex = 1, pageSize = 20,
  status = 'ALL', sort = 'DESC',
  keyword, symbol, tag, version,
} = {}) {
  const res = await api.post('/public/token/search', {
    type, listType, pageIndex, pageSize, status, sort,
    keyword, symbol,
    tag: normalizeArray(tag),
    version,
  })
  const unwrapped = unwrap(res, 'getTokenList')
  return Array.isArray(unwrapped) ? unwrapped : (unwrapped?.records ?? [])
}

/** Fetches ranked tokens by type (e.g. HOT, NEW) with optional cap/volume/holder filters. */
export async function getTokenRankings({
  type, pageSize = 20,
  rankingKind, version, symbol,
  minCap, maxCap, minVol, maxVol, minHold, maxHold,
} = {}) {
  if (!type) throw new Error('getTokenRankings requires a type parameter')
  const body = { type, pageSize }
  if (rankingKind) body.rankingKind = rankingKind
  if (version)     body.version     = version
  if (symbol)      body.symbol      = symbol
  if (minCap  != null) body.minCap  = minCap
  if (maxCap  != null) body.maxCap  = maxCap
  if (minVol  != null) body.minVol  = minVol
  if (maxVol  != null) body.maxVol  = maxVol
  if (minHold != null) body.minHold = minHold
  if (maxHold != null) body.maxHold = maxHold
  const res = await api.post('/public/token/ranking', body)
  return unwrap(res, 'getTokenRankings')?.records ?? []
}

/** Fetches detailed info for a single token by its contract address. */
export async function getTokenDetail(tokenAddress) {
  const res = await api.get(`/private/token/get/v2?address=${tokenAddress}`)
  return unwrap(res, 'getTokenDetail')
}

/**
 * Finds tokens created by a specific wallet address using public search.
 * Four.meme doesn't expose a "by creator" endpoint for arbitrary wallets,
 * so we fetch recent tokens and filter client-side. Deduplicates by address.
 */
export async function getTokensByWallet(walletAddress, { pageSize = 100 } = {}) {
  const [p1, p2] = await Promise.all([
    getTokenList({ type: 'NEW', pageSize: 50, pageIndex: 1, status: 'ALL' }),
    getTokenList({ type: 'NEW', pageSize: 50, pageIndex: 2, status: 'ALL' }),
  ])
  const all = [...p1, ...p2]
  const lower = walletAddress.toLowerCase()
  const filtered = all.filter(t =>
    (t.userAddress ?? '').toLowerCase() === lower
  )
  // Deduplicate by token address
  const seen = new Set()
  return filtered.filter(t => {
    const k = t.tokenAddress ?? t.address
    if (seen.has(k)) return false
    seen.add(k); return true
  })
}
