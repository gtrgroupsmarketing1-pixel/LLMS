import { Router } from 'express';
import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

export const billingWebhookRouter = Router();

billingWebhookRouter.post('/stripe', async (req, res, next) => {
  try {
    const event = req.body;
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const payment = await prisma.payment.findFirst({
        where: { externalId: session.id, status: 'PENDING' },
      });

      if (payment) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'CAPTURED', capturedAt: new Date() },
          }),
          prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: 'PAID', paidAt: new Date() },
          }),
          prisma.paymentEvent.create({
            data: { tenantId: payment.tenantId, paymentId: payment.id, kind: 'WEBHOOK_CAPTURED' },
          }),
        ]);
        await logAudit(payment.tenantId, 'stripe', 'payment.captured_webhook', `payment:${payment.id}`);
      }
    }
    res.json({ received: true });
  } catch (e) { next(e); }
});

billingWebhookRouter.post('/telr', async (req, res, next) => {
  try {
    const { cartid, order_ref, status } = req.body;
    
    if (status === 'A' || status === '3') {
      const payment = await prisma.payment.findFirst({
        where: { externalId: order_ref, status: 'PENDING' },
      });

      if (payment) {
        await prisma.$transaction([
          prisma.payment.update({ where: { id: payment.id }, data: { status: 'CAPTURED', capturedAt: new Date() } }),
          prisma.invoice.update({ where: { id: payment.invoiceId }, data: { status: 'PAID', paidAt: new Date() } }),
          prisma.paymentEvent.create({ data: { tenantId: payment.tenantId, paymentId: payment.id, kind: 'WEBHOOK_CAPTURED' } }),
        ]);
      }
    }
    res.status(200).send('OK');
  } catch (e) { next(e); }
});
