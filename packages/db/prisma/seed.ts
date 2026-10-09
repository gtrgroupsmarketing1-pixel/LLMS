import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('ChangeMe123!', { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: 'owner@lmms.local' },
    update: {},
    create: {
      kind: 'AGENCY',
      email: 'owner@lmms.local',
      passwordHash,
      agencyRole: 'OWNER',
    },
  });
  // eslint-disable-next-line no-console
  console.log('Seeded agency owner: owner@lmms.local / ChangeMe123!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
