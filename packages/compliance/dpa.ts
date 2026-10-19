import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

const DPA_TEMPLATE_V1 = `# Data Processing Agreement (v1)

This DPA is between LMMS (Processor) and {client_name} (Controller).

1. Scope: LMMS processes personal data of {client_name}'s end customers for the purpose of marketing services.
2. Legal basis: consent as configured per GCC jurisdiction.
3. Sub-processors: Meta (WhatsApp Business API), payment gateways, SMS providers.
4. Retention: per country rule set configured in LMMS.
5. Data subject rights: access, erasure, portability handled within LMMS.
6. Audit: all actions logged immutably for a minimum of 3 years.
`;

export async function getOrCreateDpa(tenantId: string, actorId: string) {
  const existing = await prisma.dpaTemplate.findFirst({
    where: { tenantId },
    orderBy: { version: 'desc' },
  });
  if (existing) return existing;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const content = DPA_TEMPLATE_V1.replace('{client_name}', tenant?.nameEn ?? 'Client');
  const created = await prisma.dpaTemplate.create({
    data: { tenantId, version: 1, contentMd: content },
  });
  await logAudit(tenantId, actorId, 'dpa.create', `dpa:${created.id}`);
  return created;
}

export interface AcceptDpaInput {
  tenantId: string;
  actorId: string;
  dpaId: string;
  ipAddress?: string;
  signatureData?: string;
}

export async function acceptDpa(input: AcceptDpaInput) {
  const dpa = await prisma.dpaTemplate.findUnique({
    where: { id: input.dpaId },
  });
  if (!dpa) throw new Error('dpa_not_found');

  const acceptance = await prisma.dpaAcceptance.create({
    data: {
      tenantId: input.tenantId,
      dpaTemplateId: dpa.id,
      acceptedBy: input.actorId,
      ipAddress: input.ipAddress ?? null,
      signatureData: input.signatureData ?? null,
    },
  });

  await prisma.tenant.update({
    where: { id: input.tenantId },
    data: { dpaAcceptedAt: new Date() },
  });

  await logAudit(input.tenantId, input.actorId, 'dpa.accept', `dpa_acceptance:${acceptance.id}`);
  return acceptance;
}
