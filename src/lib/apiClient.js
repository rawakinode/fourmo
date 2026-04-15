/**
 * apiClient.js
 *
 * HTTP client for the Express backend (/api).
 * Handles AI generation endpoints (token concept, image, lore, marketing)
 * and token analysis. Automatically unwraps response data and normalizes errors.
 */

import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 60_000,
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

/** Generate a full token concept (name, symbol, desc, image prompt, etc.) from a text idea. */
export const generateToken = (idea) =>
  apiClient.post('/generate-token', { idea })

/** Generate a token logo image from an AI prompt. Returns base64 image data. */
export const generateImage = (prompt, name, shortName) =>
  apiClient.post('/generate-image', { prompt, name, shortName })

/** Generate lore, launch tweet, and use-case copy for a token. */
export const generateLore = (meta) =>
  apiClient.post('/generate-lore', meta)

/** Run AI health analysis on a token. Combines on-chain data with AI scoring. */
export const analyzeToken = (tokenAddress, tokenData) =>
  apiClient.post('/analyze-token', { tokenAddress, tokenData })

export default apiClient
