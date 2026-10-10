import express from 'express';
import { errorHandler } from './middleware/error';
import { authRouter } from './routes/auth.routes';
import { tenantRouter } from './routes/tenant.routes';
import { ingestionRouter } from './routes/ingestion.routes';
import { segmentationRouter } from './routes/segmentation.routes';
import { campaignRouter } from './routes/campaign.routes';
import { complianceRouter } from './routes/compliance.routes';
import { automationRouter } from './routes/automation.routes';
import { portalRouter } from './routes/portal.routes';
import { reportingRouter } from './routes/reporting.routes';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'lmms-api' }));
  app.use('/auth', authRouter);
  app.use('/tenants', tenantRouter);
  app.use('/ingestion', ingestionRouter);
  app.use('/segmentation', segmentationRouter);
  app.use('/campaigns', campaignRouter);
  app.use('/compliance', complianceRouter);
  app.use('/automations', automationRouter);
  app.use('/portal', portalRouter);
  app.use('/reporting', reportingRouter);

  app.use(errorHandler);
  return app;
}
