/**
 * apiClient.js
 *
 * HTTP client for the Express backend (/api).
 * Handles AI generation endpoints (token concept, image, lore, marketing)
 * and token analysis. Automatically unwraps response data and normalizes errors.
 */

import axios from 'axios'

const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || '') + '/api',
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
})

// Unwrap response to return data directly; normalize error messages
apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Unknown error'
    throw new Error(msg)
  }
)

/** Generate a full token concept (name, symbol, desc, image prompt, etc.) from a text idea.
 *  Optionally pass imageStyle to guide the AI's visual aesthetic choice. */
export const generateToken = (idea, imageStyle) =>
  apiClient.post('/generate-token', { idea, imageStyle: imageStyle || undefined })

/** Generate a token logo image from an AI prompt. Returns base64 image data.
 *  Pass imageNegativePrompt from generate-token for style-aware negative guidance. */
export const generateImage = (prompt, name, shortName, imageNegativePrompt) =>
  apiClient.post('/generate-image', { prompt, name, shortName, imageNegativePrompt: imageNegativePrompt || undefined })

/** Generate lore, launch tweet, and use-case copy for a token. */
export const generateLore = (meta) =>
  apiClient.post('/generate-lore', meta)

/** Score a token concept's viral potential across 4 dimensions. */
export const scoreToken = (meta) =>
  apiClient.post('/score-token', meta)

/** Run AI health analysis on a token. Combines on-chain data with AI scoring. */
export const analyzeToken = (tokenAddress, tokenData) =>
  apiClient.post('/analyze-token', { tokenAddress, tokenData })

/** Fetches real-time multi-chain meme trend analysis. */
export const analyzeTrend = () =>
  apiClient.post('/trend-analysis', {})

export default apiClient
