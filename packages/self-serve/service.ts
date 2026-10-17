import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

export interface SignupInput {
  email: string;
  contactName?: string;
  businessName: string;
  businessNameAr?: string;
  phone?: string;
  country: string;
  currency: string;
  referralSource?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function requestSignup(input: SignupInput) {
  const existing = await prisma.signupRequest.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (existing) throw new Error('email_already_registered');

  const request = await prisma.signupRequest.create({
    data: {
      email: input.email.toLowerCase(),
      contactName: input.contactName ?? null,
      businessName: input.businessName,
      businessNameAr: input.businessNameAr ?? null,
      phone: input.phone ?? null,
      country: input.country,
      currency: input.currency,
      referralSource: input.referralSource ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      status: 'PENDING',
    },
  });

  return request;
}

export async function listSignupRequests(status?: string) {
  return prisma.signupRequest.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function approveSignup(requestId: string, actorId: string) {
  const req = await prisma.signupRequest.findUnique({ where: { id: requestId } });
  if (!req) throw new Error('signup_not_found');
  if (req.status !== 'PENDING') throw new Error('signup_not_pending');

  return prisma.signupRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED' },
  });
}

export async function rejectSignup(requestId: string, actorId: string, reason: string) {
  const req = await prisma.signupRequest.findUnique({ where: { id: requestId } });
  if (!req) throw new Error('signup_not_found');

  return prisma.signupRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', rejectionReason: reason },
  });
}

export async function provisionTenant(requestId: string, actorId: string) {
  const req = await prisma.signupRequest.findUnique({ where: { id: requestId } });
  if (!req) throw new Error('signup_not_found');
  if (req.status !== 'APPROVED') throw new Error('signup_not_approved');
  if (req.tenantId) throw new Error('signup_already_provisioned');

  // 1. Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      nameEn: req.businessName,
      nameAr: req.businessNameAr ?? req.businessName,
      mode: 'STANDALONE',
      country: req.country,
      currency: req.currency,
      timezone: 'Asia/Dubai', // Default for now
      package: 'LAUNCH',
      status: 'ACTIVE',
    },
  });

  // 2. Create SelfServeConfig
  await prisma.selfServeConfig.create({
    data: {
      tenantId: tenant.id,
      isSelfServe: true,
    },
  });

  // 3. Seed onboarding tasks
  const onboardingTasks = [
    { key: 'add_customers', title: 'Import your first customer list' },
    { key: 'create_campaign', title: 'Create and send a WhatsApp campaign' },
    { key: 'connect_data', title: 'Connect a data source' },
    { key: 'invite_team', title: 'Invite your team' },
    { key: 'review_report', title: 'Review your first weekly report' },
  ];

  await prisma.onboardingTask.createMany({
    data: onboardingTasks.map((t) => ({
      tenantId: tenant.id,
      key: t.key,
      title: t.title,
    })),
  });

  // 4. Link back to signup
  await prisma.signupRequest.update({
    where: { id: requestId },
    data: {
      status: 'PROVISIONED',
      tenantId: tenant.id,
    },
  });

  // 5. Seed health score
  await prisma.tenantHealthScore.create({
    data: {
      tenantId: tenant.id,
      score: 10,
      components: { selfServe: 10 } as never,
    },
  });

  await logAudit(tenant.id, actorId, 'self_serve.provision', `signup:${requestId}`);

  return tenant;
}

export async function getOnboardingTasks(tenantId: string) {
  return prisma.onboardingTask.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function completeOnboardingTask(tenantId: string, key: string) {
  const task = await prisma.onboardingTask.findUnique({
    where: { tenantId_key: { tenantId, key } },
  });
  if (!task) throw new Error('task_not_found');

  return prisma.onboardingTask.update({
    where: { id: task.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
}

export async function getSelfServeConfig(tenantId: string) {
  return prisma.selfServeConfig.findUnique({ where: { tenantId } });
}
