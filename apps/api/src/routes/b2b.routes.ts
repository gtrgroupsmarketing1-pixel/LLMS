import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/b2b.service';
import { templatesForCategory, OUTREACH_TEMPLATES } from '@lmms/b2b';

export const b2bRouter = Router();
b2bRouter.use(requireAuth);

b2bRouter.get(
  '/templates',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const category = req.query.category ? String(req.query.category) : null;
      res.json(category ? templatesForCategory(category) : OUTREACH_TEMPLATES);
    } catch (e) { next(e); }
  },
);

b2bRouter.get(
  '/tenants/:tenantId/prospects',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listProspects({
          tenantId: req.params.tenantId as string,
          status: req.query.status ? String(req.query.status) : undefined,
          category: req.query.category ? String(req.query.category) : undefined,
          search: req.query.search ? String(req.query.search) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

b2bRouter.post(
  '/tenants/:tenantId/prospects',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.createProspect({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          businessName: String(req.body?.businessName ?? ''),
          businessNameAr: req.body?.businessNameAr
            ? String(req.body.businessNameAr)
            : undefined,
          category: (req.body?.category ?? 'OTHER') as never,
          contactName: req.body?.contactName ? String(req.body.contactName) : undefined,
          contactPhone: req.body?.contactPhone
            ? String(req.body.contactPhone)
            : undefined,
          contactEmail: req.body?.contactEmail
            ? String(req.body.contactEmail)
            : undefined,
          zone: req.body?.zone ? String(req.body.zone) : undefined,
          country: String(req.body?.country ?? 'AE'),
          source: req.body?.source ? String(req.body.source) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

b2bRouter.get(
  '/tenants/:tenantId/prospects/:prospectId',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const p = await svc.getProspect(
        req.params.tenantId as string,
        req.params.prospectId as string,
      );
      if (!p) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(p);
    } catch (e) { next(e); }
  },
);

b2bRouter.post(
  '/tenants/:tenantId/prospects/:prospectId/transition',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.transitionProspect({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          prospectId: req.params.prospectId as string,
          to: req.body?.to as never,
          notes: req.body?.notes ? String(req.body.notes) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

b2bRouter.post(
  '/tenants/:tenantId/prospects/:prospectId/outreach',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.logOutreach({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          prospectId: req.params.prospectId as string,
          channel: (req.body?.channel ?? 'EMAIL') as never,
          direction: (req.body?.direction ?? 'OUTBOUND') as never,
          templateKey: req.body?.templateKey
            ? String(req.body.templateKey)
            : undefined,
          subject: req.body?.subject ? String(req.body.subject) : undefined,
          body: req.body?.body ? String(req.body.body) : undefined,
          outcome: req.body?.outcome ? String(req.body.outcome) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

b2bRouter.post(
  '/tenants/:tenantId/prospects/:prospectId/proposals',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.createProposal({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          prospectId: req.params.prospectId as string,
          input: {
            title: String(req.body?.title ?? ''),
            items: (req.body?.items ?? []) as never,
            currency: String(req.body?.currency ?? 'AED'),
            notes: req.body?.notes ? String(req.body.notes) : undefined,
          },
        }),
      );
    } catch (e) { next(e); }
  },
);

b2bRouter.post(
  '/tenants/:tenantId/proposals/:proposalId/send',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.sendProposal({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          proposalId: req.params.proposalId as string,
        }),
      );
    } catch (e) { next(e); }
  },
);

b2bRouter.post(
  '/tenants/:tenantId/proposals/:proposalId/decide',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.decideProposal({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          proposalId: req.params.proposalId as string,
          decision: (req.body?.decision ?? 'ACCEPTED') as never,
          reason: req.body?.reason ? String(req.body.reason) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

b2bRouter.post(
  '/tenants/:tenantId/contracts',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.recordContract({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          prospectId: req.body?.prospectId ? String(req.body.prospectId) : undefined,
          name: String(req.body?.name ?? ''),
          value: Number(req.body?.value ?? 0),
          currency: String(req.body?.currency ?? 'AED'),
          signedDate: new Date(String(req.body?.signedDate ?? new Date().toISOString())),
          startDate: new Date(String(req.body?.startDate ?? new Date().toISOString())),
          endDate: req.body?.endDate ? new Date(String(req.body.endDate)) : undefined,
          renewalDate: req.body?.renewalDate
            ? new Date(String(req.body.renewalDate))
            : undefined,
          originatingCampaignId: req.body?.originatingCampaignId
            ? String(req.body.originatingCampaignId)
            : undefined,
          originatingAdCampaignId: req.body?.originatingAdCampaignId
            ? String(req.body.originatingAdCampaignId)
            : undefined,
          notes: req.body?.notes ? String(req.body.notes) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

b2bRouter.get(
  '/tenants/:tenantId/contracts',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listContracts(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

b2bRouter.get(
  '/tenants/:tenantId/pipeline-stats',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.pipelineStats(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);
