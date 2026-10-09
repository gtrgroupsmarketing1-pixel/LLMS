import crypto from 'node:crypto';
import { prisma } from '@lmms/db';
import {
  hashPassword,
  verifyPassword,
  signAccess,
  signRefresh,
  generateOtp,
  hashOtp,
  verifyOtp,
} from '@lmms/auth';
import { AuthError } from '@lmms/contracts';
import { logAudit } from '@lmms/audit';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function issueTokens(
  userId: string,
  role: string,
  kind: 'agency' | 'client',
  tenantId?: string,
) {
  const jti = crypto.randomUUID();
  const familyId = crypto.randomUUID();
  const accessToken = signAccess({ sub: userId, role, kind, tenantId });
  const refreshToken = signRefresh({ sub: userId, jti });
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.refreshToken.create({
    data: {
      userId,
      jti,
      familyId,
      hash,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  await logAudit(tenantId ?? 'agency', userId, 'auth.login', `user:${userId}`);
  return { accessToken, refreshToken, expiresIn: 900 };
}

export async function agencyLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.kind !== 'AGENCY' || !user.passwordHash) {
    throw new AuthError('invalid_credentials');
  }
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw new AuthError('invalid_credentials');
  return issueTokens(user.id, user.agencyRole ?? 'OWNER', 'agency');
}

export async function requestOtp(phone: string) {
  const otp = generateOtp();
  const hash = await hashOtp(otp);
  await prisma.otpCode.create({
    data: { phone, hash, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  // TODO dispatch via WhatsApp/SMS in later gate
  return { delivered: true, expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function verifyOtpAndLogin(phone: string, otp: string) {
  const record = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new AuthError('otp_expired');
  if (record.attempts >= OTP_MAX_ATTEMPTS) throw new AuthError('otp_locked', 429);

  const ok = await verifyOtp(record.hash, otp);
  if (!ok) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AuthError('otp_invalid');
  }
  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: { kind: 'CLIENT', phone, clientRole: 'OWNER' },
    });
  }
  return issueTokens(
    user.id,
    user.clientRole ?? 'OWNER',
    'client',
    user.tenantId ?? undefined,
  );
}

export async function refresh(refreshToken: string) {
  const { verifyRefresh } = await import('@lmms/auth');
  let payload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    throw new AuthError('invalid_refresh');
  }
  const record = await prisma.refreshToken.findUnique({ where: { jti: payload.jti } });
  if (!record || record.revokedAt || record.usedAt || record.expiresAt < new Date()) {
    throw new AuthError('refresh_reuse_detected');
  }
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { usedAt: new Date(), revokedAt: new Date() },
  });
  await prisma.refreshToken.updateMany({
    where: { familyId: record.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) throw new AuthError('user_not_found');
  const kind = user.kind === 'AGENCY' ? 'agency' : 'client';
  return issueTokens(
    user.id,
    user.agencyRole ?? user.clientRole ?? 'OWNER',
    kind,
    user.tenantId ?? undefined,
  );
}

void hashPassword; // reserved for seed scripts
