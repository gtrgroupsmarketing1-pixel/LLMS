import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { requireClient } from '../middleware/requireClient';
import * as svc from '../services/billing.service';

export const billingRouter = Router();

// Agency routes
billingRouter.get(
  '/tenants/:tenantId/subscription',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.getSubscription(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

billingRouter.get(
  '/tenants/:tenantId/invoices',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      res.json(await svc.listInvoices(req.params.tenantId as string, status));
    } catch (e) { next(e); }
  },
);

billingRouter.get(
  '/tenants/:tenantId/invoices/:invoiceId',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const inv = await svc.getInvoice(
        req.params.tenantId as string,
        req.params.invoiceId as string,
      );
      if (!inv) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(inv);
    } catch (e) { next(e); }
  },
);

billingRouter.post(
  '/tenants/:tenantId/invoices',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const inv = await svc.createInvoice({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        tenantPrefix: String(req.body?.tenantPrefix ?? 'TNT'),
        country: String(req.body?.country ?? 'AE'),
        currency: String(req.body?.currency ?? 'AED'),
        periodStart: new Date(String(req.body?.periodStart ?? new Date().toISOString())),
        periodEnd: new Date(String(req.body?.periodEnd ?? new Date().toISOString())),
        dueDate: new Date(String(req.body?.dueDate ?? new Date().toISOString())),
        baseFee: Number(req.body?.baseFee ?? 0),
        baseFeeDescription: String(req.body?.baseFeeDescription ?? 'Monthly package fee'),
        usageLines: (req.body?.usageLines ?? []) as never,
        notes: req.body?.notes ? String(req.body.notes) : undefined,
      });
      res.status(201).json(inv);
    } catch (e) { next(e); }
  },
);

billingRouter.post(
  '/tenants/:tenantId/invoices/:invoiceId/pdf',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.renderInvoicePdf(
          req.params.tenantId as string,
          req.params.invoiceId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

billingRouter.post(
  '/tenants/:tenantId/invoices/:invoiceId/send',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.sendInvoice({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          invoiceId: req.params.invoiceId as string,
        }),
      );
    } catch (e) { next(e); }
  },
);

billingRouter.post(
  '/tenants/:tenantId/invoices/:invoiceId/void',
  requireAuth,
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.voidInvoice({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          invoiceId: req.params.invoiceId as string,
          reason: req.body?.reason ? String(req.body.reason) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

billingRouter.post(
  '/tenants/:tenantId/invoices/:invoiceId/payments',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.initiatePayment({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          invoiceId: req.params.invoiceId as string,
          provider: (req.body?.provider ?? 'STRIPE') as never,
          returnUrl: String(req.body?.returnUrl ?? 'https://example.com/return'),
        }),
      );
    } catch (e) { next(e); }
  },
);

billingRouter.post(
  '/tenants/:tenantId/payments/:paymentId/capture',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.capturePayment({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          paymentId: req.params.paymentId as string,
        }),
      );
    } catch (e) { next(e); }
  },
);

billingRouter.get(
  '/tenants/:tenantId/payments',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listPayments(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

billingRouter.post(
  '/seed',
  requireAuth,
  requireAgency('OWNER', 'ADMIN'),
  async (_req, res, next) => {
    try {
      const vatCount = await svc.seedVatRates();
      const pkgCount = await svc.seedPackages();
      res.json({ vatSeeded: vatCount, packagesSeeded: pkgCount });
    } catch (e) { next(e); }
  },
);

// Portal (client) routes
billingRouter.get('/portal/invoices', requireClient, async (req, res, next) => {
  try {
    res.json(await svc.listInvoices(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

billingRouter.get(
  '/portal/invoices/:invoiceId',
  requireClient,
  async (req, res, next) => {
    try {
      const inv = await svc.getInvoice(
        req.auth!.tenantId!,
        req.params.invoiceId as string,
      );
      if (!inv) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(inv);
    } catch (e) { next(e); }
  },
);

billingRouter.get(
  '/portal/invoices/:invoiceId/pdf',
  requireClient,
  async (req, res, next) => {
    try {
      const inv = await svc.getInvoice(
        req.auth!.tenantId!,
        req.params.invoiceId as string,
      );
      if (!inv || !inv.pdfData) {
        res.status(404).json({ error: 'pdf_not_ready' });
        return;
      }
      res.setHeader('Content-Type', inv.pdfMime ?? 'application/pdf');
      res.send(Buffer.from(inv.pdfData, 'base64'));
    } catch (e) { next(e); }
  },
);
