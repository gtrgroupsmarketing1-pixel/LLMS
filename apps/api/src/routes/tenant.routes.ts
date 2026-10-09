import { Router } from 'express';
import { TenantCreateSchema, TenantListQuerySchema } from '@lmms/contracts';
import * as tenantService from '../services/tenant.service';
import { requireAuth, requireAgency } from '../middleware/auth';

export const tenantRouter = Router();

tenantRouter.use(requireAuth);

tenantRouter.get('/', requireAgency(), async (req, res, next) => {
  try {
    const query = TenantListQuerySchema.parse(req.query);
    res.json(await tenantService.listTenants(query));
  } catch (e) {
    next(e);
  }
});

tenantRouter.post('/', requireAgency('OWNER', 'ADMIN', 'OPS'), async (req, res, next) => {
  try {
    const input = TenantCreateSchema.parse(req.body);
    const tenant = await tenantService.createTenant(input, req.auth!.sub);
    res.status(201).json(tenant);
  } catch (e) {
    next(e);
  }
});

tenantRouter.get('/:id', requireAgency(), async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenant(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'not_found' });
    return res.json(tenant);
  } catch (e) {
    return next(e);
  }
});
