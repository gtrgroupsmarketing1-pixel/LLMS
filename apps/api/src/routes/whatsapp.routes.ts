import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { prisma } from '@lmms/db';
import { createWhatsAppAdapterForTenant } from '@lmms/whatsapp';

export const whatsappRouter = Router();

// Public webhook for Meta status updates
whatsappRouter.post('/webhook', async (req, res) => {
  // In production, verify X-Hub-Signature-256 header using your Meta App Secret
  const body = req.body;
  
  if (body.object === 'whatsapp_business_account') {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === 'messages') {
          const value = change.value;
          // Handle Statuses (delivered, read, failed)
          if (value.statuses) {
            for (const status of value.statuses) {
              await prisma.message.updateMany({
                where: { metaMessageId: status.id },
                data: {
                  status: status.status.toUpperCase() as any, // SENT, DELIVERED, READ
                  deliveredAt: status.status === 'delivered' ? new Date() : undefined,
                  readAt: status.status === 'read' ? new Date() : undefined,
                },
              });
            }
          }
          // Handle Inbound Messages (Replies)
          if (value.messages) {
            for (const msg of value.messages) {
              const fromPhone = '+' + msg.from;
              // Find customer and mark their previous message as REPLIED
              const customer = await prisma.endCustomer.findFirst({
                where: { phone: fromPhone },
              });
              if (customer) {
                await prisma.message.updateMany({
                  where: { customerId: customer.id, status: 'DELIVERED' },
                  data: { status: 'REPLIED' },
                });
                // Also store the incoming message
                await prisma.clientMessageInbox.create({
                  data: {
                    tenantId: customer.tenantId,
                    customerId: customer.id,
                    channel: 'WHATSAPP',
                    direction: 'INBOUND',
                    body: msg.text?.body ?? '[Media]',
                    fromPhone,
                    status: 'RECEIVED',
                  },
                });
              }
            }
          }
        }
      }
    }
  }
  res.sendStatus(200); // Always 200 to Meta so it doesn't retry
});

// Verify webhook endpoint for Meta setup
whatsappRouter.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Agency routes
whatsappRouter.use(requireAuth);

whatsappRouter.get(
  '/tenants/:tenantId/config',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const config = await prisma.whatsAppConfig.findUnique({
        where: { tenantId: req.params.tenantId as string },
        select: { id: true, wabaId: true, phoneNumberId: true, status: true, updatedAt: true } // Don't return token
      });
      res.json(config);
    } catch (e) { next(e); }
  }
);

whatsappRouter.post(
  '/tenants/:tenantId/config',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId as string;
      const { wabaId, phoneNumberId, accessToken } = req.body;

      const config = await prisma.whatsAppConfig.upsert({
        where: { tenantId },
        update: { wabaId, phoneNumberId, accessToken, status: 'CONNECTED' },
        create: { tenantId, wabaId, phoneNumberId, accessToken, status: 'CONNECTED' },
      });

      // Test the connection immediately
      const adapter = await createWhatsAppAdapterForTenant(tenantId);
      const valid = await adapter.validate();

      if (!valid) {
        await prisma.whatsAppConfig.update({ where: { id: config.id }, data: { status: 'REVOKED' } });
        res.status(400).json({ error: 'invalid_whatsapp_credentials' });
        return;
      }

      res.status(201).json({ status: 'CONNECTED', phoneNumberId: config.phoneNumberId });
    } catch (e) { next(e); }
  }
);
