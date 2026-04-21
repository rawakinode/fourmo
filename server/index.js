/**
 * server/index.js
 *
 * Entry point for MemeAgent Studio backend.
 */

import 'dotenv/config'
import app from './src/app.js'
import { AI_LLM_PROVIDER, AI_IMAGE_PROVIDER, LLM_MODEL, IMAGE_MODEL } from './src/config/ai-config.js'

const PORT = process.env.PORT || 3001

const required = ['FIREWORKS_API_KEY', 'DGRID_API_KEY']
for (const key of required) {
  if (!process.env[key]) {
    console.error(`✖ Missing env: ${key}. Background logic might fail.`)
  }
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✓ Fourmo backend running on :${PORT}`)
    console.log(`  LLM Provider → ${AI_LLM_PROVIDER} (${LLM_MODEL})`)
    console.log(`  Img Provider → ${AI_IMAGE_PROVIDER} (${IMAGE_MODEL})`)
  })
}

export default app
