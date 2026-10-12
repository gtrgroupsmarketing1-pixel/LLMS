import express from 'express';
import { errorHandler } from './middleware/error';
import { requestIdMiddleware } from './middleware/requestId';
import { globalRateLimit } from './middleware/rateLimit';
import { tenantScopeGuard } from './middleware/tenantScope';
import { authRouter } from './routes/auth.routes';
import { tenantRouter } from './routes/tenant.routes';
import { ingestionRouter } from './routes/ingestion.routes';
import { segmentationRouter } from './routes/segmentation.routes';
import { campaignRouter } from './routes/campaign.routes';
import { complianceRouter } from './routes/compliance.routes';
import { automationRouter } from './routes/automation.routes';
import { portalRouter } from './routes/portal.routes';
import { reportingRouter } from './routes/reporting.routes';
import { contentCalendarRouter } from './routes/content-calendar.routes';
import { migrationRouter } from './routes/migration.routes';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use(globalRateLimit);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'lmms-api' }));

  app.use('/auth', authRouter);
  app.use('/tenants', tenantScopeGuard, tenantRouter);
  app.use('/ingestion', tenantScopeGuard, ingestionRouter);
  app.use('/segmentation', tenantScopeGuard, segmentationRouter);
  app.use('/campaigns', tenantScopeGuard, campaignRouter);
  app.use('/compliance', complianceRouter);
  app.use('/automations', tenantScopeGuard, automationRouter);
  app.use('/portal', portalRouter);
  app.use('/reporting', tenantScopeGuard, reportingRouter);
  app.use('/content-calendar', contentCalendarRouter);
  app.use('/migration', tenantScopeGuard, migrationRouter);

  app.use(errorHandler);
  return app;
}
