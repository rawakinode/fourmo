import { Router } from 'express';
import * as aiController from '../controllers/ai-controller.js';
import * as proxyController from '../controllers/proxy-controller.js';
import { AI_LLM_PROVIDER, AI_IMAGE_PROVIDER, LLM_MODEL, IMAGE_MODEL } from '../config/ai-config.js';

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
router.post('/generate-token', aiController.generateToken);
router.post('/generate-image', aiController.generateImage);
router.post('/generate-lore', aiController.generateLore);
router.post('/score-token', aiController.scoreToken);
router.post('/marketing-kit', aiController.marketingKit);
router.post('/analyze-token', aiController.analyzeToken);
router.post('/trend-analysis', aiController.trendAnalysis);

// Four.meme proxy route
router.all('/four-meme/*', proxyController.proxyFourMeme);

export default router;
