import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes/api.js';
import { requestLogger } from './middleware/validator.js';
import { standardLimiter } from './middleware/rate-limiter.js';

const app = express();

app.use(helmet());

const allowedOrigins = [
  'https://fourmo-ai.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(standardLimiter);
app.use(express.json({ limit: '10mb' }));
app.use('/api/four-meme', express.raw({ type: '*/*', limit: '10mb' }));

// Middleware
app.use(requestLogger);

// Routes
app.use('/api', apiRoutes);

export default app;
