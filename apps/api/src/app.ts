import express from 'express';
import { errorHandler } from './middleware/error';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'lmms-api' }));

  app.use(errorHandler);
  return app;
}
