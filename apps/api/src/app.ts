import express from 'express';
import { errorHandler } from './middleware/error';
import { authRouter } from './routes/auth.routes';
import { tenantRouter } from './routes/tenant.routes';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'lmms-api' }));
  app.use('/auth', authRouter);
  app.use('/tenants', tenantRouter);

  app.use(errorHandler);
  return app;
}
