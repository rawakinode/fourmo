import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { requestLogger } from './middleware/validator.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api/four-meme', express.raw({ type: '*/*', limit: '10mb' }));

// Middleware
app.use(requestLogger);

// Routes
app.use('/api', apiRoutes);

export default app;
