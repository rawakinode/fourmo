/**
 * server/index.js
 *
 * Entry point for MemeAgent Studio backend.
 */

import 'dotenv/config'
import app from './src/app.js'
import { AI_LLM_PROVIDER, AI_IMAGE_PROVIDER, LLM_MODEL, IMAGE_MODEL } from './src/config/ai-config.js'

const PORT = process.env.PORT || 3001

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✓ MemeAgent backend running on :${PORT}`)
    console.log(`  LLM Provider → ${AI_LLM_PROVIDER} (${LLM_MODEL})`)
    console.log(`  Img Provider → ${AI_IMAGE_PROVIDER} (${IMAGE_MODEL})`)
    
    const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY
    const DGRID_API_KEY = process.env.DGRID_API_KEY
    
    if ((AI_LLM_PROVIDER === 'fireworks' || AI_IMAGE_PROVIDER === 'fireworks') && !FIREWORKS_API_KEY) {
      console.warn('⚠  FIREWORKS_API_KEY not set — fireworks calls will fail')
    }
    if ((AI_LLM_PROVIDER === 'dgrid' || AI_IMAGE_PROVIDER === 'dgrid') && !DGRID_API_KEY) {
      console.warn('⚠  DGRID_API_KEY not set — dgrid calls will fail')
    }
  })
}

export default app
