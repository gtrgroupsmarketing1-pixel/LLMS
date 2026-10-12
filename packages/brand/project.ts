import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

export interface Milestone {
  key: string;
  label: string;
  labelAr?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  signedOffAt?: string | null;
  signedOffBy?: string | null;
}

export async function createBrandProject(opts: {
  tenantId: string;
  actorId: string;
  name: string;
  milestones: Milestone[];
}) {
  const project = await prisma.brandProject.create({
    data: {
      tenantId: opts.tenantId,
      name: opts.name,
      milestones: opts.milestones as never,
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'brand_project.create',
    `brand_project:${project.id}`,
  );
  return project;
}

export async function getBrandProject(tenantId: string) {
  return prisma.brandProject.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateMilestone(opts: {
  tenantId: string;
  actorId: string;
  projectId: string;
  milestoneKey: string;
  status: Milestone['status'];
  signedOffBy?: string;
}) {
  const project = await prisma.brandProject.findUnique({
    where: { id: opts.projectId },
  });
  if (!project || project.tenantId !== opts.tenantId) {
    throw new Error('project_not_found');
  }

  const milestones = Array.isArray(project.milestones)
    ? (project.milestones as unknown as Milestone[])
    : [];

  const updated = milestones.map((m) =>
    m.key === opts.milestoneKey
      ? {
          ...m,
          status: opts.status,
          ...(opts.status === 'DONE'
            ? {
                signedOffAt: new Date().toISOString(),
                signedOffBy: opts.signedOffBy ?? opts.actorId,
              }
            : {}),
        }
      : m,
  );

  const saved = await prisma.brandProject.update({
    where: { id: opts.projectId },
    data: { milestones: updated as never },
  });

  await logAudit(
    opts.tenantId,
    opts.actorId,
    'brand_project.milestone',
    `brand_project:${opts.projectId}:${opts.milestoneKey}`,
  );
  return saved;
}

export async function signOffProject(opts: {
  tenantId: string;
  actorId: string;
  projectId: string;
}) {
  const project = await prisma.brandProject.findUnique({
    where: { id: opts.projectId },
  });
  if (!project || project.tenantId !== opts.tenantId) {
    throw new Error('project_not_found');
  }
  const saved = await prisma.brandProject.update({
    where: { id: opts.projectId },
    data: {
      signedOffAt: new Date(),
      signedOffBy: opts.actorId,
      currentStage: 'COMPLETED',
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'brand_project.signoff',
    `brand_project:${opts.projectId}`,
  );
  return saved;
}
