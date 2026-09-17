/**
 * prisma/rehash.ts — One-shot password re-hash migration
 *
 * Run this ONCE after deploying the bcrypt update to re-hash any users whose
 * passwords are still stored as plaintext (i.e. seeded before hashing was added).
 *
 * Detection: bcrypt hashes always start with "$2b$" or "$2a$".
 * Any password that does NOT start with "$2" is treated as plaintext and re-hashed.
 *
 * Usage:
 *   npx tsx prisma/rehash.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function rehash() {
  const users = await prisma.user.findMany();

  let updated = 0;
  let alreadyHashed = 0;

  for (const user of users) {
    // bcrypt hashes start with $2b$ or $2a$ — skip if already hashed
    if (user.password.startsWith('$2')) {
      alreadyHashed++;
      continue;
    }

    console.log(`  🔄 Re-hashing password for user: ${user.username}`);
    const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    updated++;
  }

  console.log(`\n✅ Done. Re-hashed: ${updated} users. Already hashed: ${alreadyHashed} users.`);
}

rehash()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Rehash failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
