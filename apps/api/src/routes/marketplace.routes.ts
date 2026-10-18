import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/marketplace.service';

export const marketplaceRouter = Router();
marketplaceRouter.use(requireAuth);

marketplaceRouter.get('/templates', async (req, res, next) => {
  try {
    const category = req.query.category ? String(req.query.category) : undefined;
    res.json(await svc.listTemplates(category));
  } catch (e) { next(e); }
});

marketplaceRouter.get('/templates/:id', async (req, res, next) => {
  try {
    const template = await svc.getTemplate(req.params.id as string);
    if (!template || template.status !== 'PUBLISHED') {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(template);
  } catch (e) { next(e); }
});

marketplaceRouter.post(
  '/templates/:id/install',
  async (req, res, next) => {
    try {
      const tenantId = req.body?.tenantId ? String(req.body.tenantId) : req.auth!.tenantId;
      if (!tenantId) {
        res.status(400).json({ error: 'missing_tenant' });
        return;
      }
      
      if (req.auth!.kind === 'client' && req.auth!.tenantId !== tenantId) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }

      const result = await svc.installTemplate({
        tenantId,
        actorId: req.auth!.sub,
        templateId: req.params.id as string,
      });
      res.json(result);
    } catch (e) { next(e); }
  },
);

marketplaceRouter.post(
  '/publish',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const result = await svc.publishTemplate({
        actorId: req.auth!.sub,
        name: String(req.body?.name ?? ''),
        description: req.body?.description ? String(req.body.description) : undefined,
        category: req.body?.category as never,
        sourceId: String(req.body?.sourceId ?? ''),
        sourceType: req.body?.sourceType as never,
      });
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
);
