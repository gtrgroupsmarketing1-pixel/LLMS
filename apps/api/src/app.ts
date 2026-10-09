import express from 'express';
import { errorHandler } from './middleware/error';
import { authRouter } from './routes/auth.routes';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'lmms-api' }));
  app.use('/auth', authRouter);

  app.use(errorHandler);
  return app;
}
