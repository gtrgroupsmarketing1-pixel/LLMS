import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { prisma } from '@lmms/db';
import { createErpAdapterForTenant } from '@lmms/ingestion';

export const erpRouter = Router();
erpRouter.use(requireAuth);

erpRouter.get(
  '/tenants/:tenantId/config',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const config = await prisma.erpConfig.findUnique({
        where: { tenantId: req.params.tenantId as string },
        select: { id: true, apiUrl: true, status: true, lastSyncAt: true }, // don't leak apiKey
      });
      res.json(config);
    } catch (e) { next(e); }
  }
);

erpRouter.post(
  '/tenants/:tenantId/config',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId as string;
      const { apiUrl, apiKey } = req.body;

      const config = await prisma.erpConfig.upsert({
        where: { tenantId },
        update: { apiUrl, apiKey, status: 'CONNECTED' },
        create: { tenantId, apiUrl, apiKey, status: 'CONNECTED' },
      });

      // Test immediately
      const adapter = await createErpAdapterForTenant(tenantId);
      const valid = await adapter.validate();

      if (!valid) {
        await prisma.erpConfig.update({ where: { id: config.id }, data: { status: 'REVOKED' } });
        res.status(400).json({ error: 'invalid_erp_credentials' });
        return;
      }

      res.status(201).json({ status: 'CONNECTED', apiUrl: config.apiUrl });
    } catch (e) { next(e); }
  }
);
