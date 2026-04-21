import { Router } from 'express';
import * as aiController from '../controllers/ai-controller.js';
import * as proxyController from '../controllers/proxy-controller.js';
import { AI_LLM_PROVIDER, AI_IMAGE_PROVIDER, LLM_MODEL, IMAGE_MODEL } from '../config/ai-config.js';
import { aiLimiter } from '../middleware/rate-limiter.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => res.json({ 
  ok: true, 
  llmProvider: AI_LLM_PROVIDER, 
  imageProvider: AI_IMAGE_PROVIDER, 
  llm: LLM_MODEL, 
  image: IMAGE_MODEL 
}));

// AI generation routes
router.post('/generate-token', aiLimiter, aiController.generateToken);
router.post('/generate-image', aiLimiter, aiController.generateImage);
router.post('/generate-lore', aiLimiter, aiController.generateLore);
router.post('/score-token', aiLimiter, aiController.scoreToken);
router.post('/marketing-kit', aiLimiter, aiController.marketingKit);
router.post('/analyze-token', aiLimiter, aiController.analyzeToken);
router.post('/trend-analysis', aiLimiter, aiController.trendAnalysis);

// Four.meme proxy route
router.all('/four-meme/*', proxyController.proxyFourMeme);

export default router;
