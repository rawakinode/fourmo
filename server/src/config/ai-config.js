import axios from 'axios'
import 'dotenv/config'

const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY
const DGRID_API_KEY = process.env.DGRID_API_KEY

export const AI_LLM_PROVIDER = process.env.AI_LLM_PROVIDER || 'fireworks'
export const AI_IMAGE_PROVIDER = process.env.AI_IMAGE_PROVIDER || 'fireworks'

// Fireworks AI clients
export const fireworksLlm = axios.create({
  baseURL: 'https://api.fireworks.ai/inference/v1',
  headers: { Authorization: `Bearer ${FIREWORKS_API_KEY}`, 'Content-Type': 'application/json' },
  timeout: 120_000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
})

export const fireworksImgApi = axios.create({
  baseURL: 'https://api.fireworks.ai/inference/v1',
  headers: { Authorization: `Bearer ${FIREWORKS_API_KEY}`, 'Content-Type': 'application/json', Accept: 'image/jpeg' },
  responseType: 'arraybuffer',
  timeout: 120_000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
})

export const FIREWORKS_LLM_MODEL = process.env.FIREWORKS_LLM_MODEL || 'accounts/fireworks/models/kimi-k2-instruct-0905'
export const FIREWORKS_IMAGE_MODEL = process.env.FIREWORKS_IMAGE_MODEL || 'accounts/fireworks/models/flux-1-dev-fp8'

// DGrid AI client
export const dgridApi = axios.create({
  baseURL: 'https://api.dgrid.ai/v1',
  headers: { Authorization: `Bearer ${DGRID_API_KEY}`, 'Content-Type': 'application/json' },
  timeout: 120_000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
})

export const DGRID_LLM_MODEL = process.env.DGRID_LLM_MODEL || 'gpt-4o'
export const DGRID_IMAGE_MODEL = process.env.DGRID_IMAGE_MODEL || 'dall-e-3'

// Resolved model names based on provider selection
export const LLM_MODEL = AI_LLM_PROVIDER === 'dgrid' ? DGRID_LLM_MODEL : FIREWORKS_LLM_MODEL
export const IMAGE_MODEL = AI_IMAGE_PROVIDER === 'dgrid' ? DGRID_IMAGE_MODEL : FIREWORKS_IMAGE_MODEL
