import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client';

export type PrismaTx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$use" | "$extends">;

declare global {
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const connectionUrl = new URL(databaseUrl);
if (connectionUrl.searchParams.get('sslmode') === 'require') {
  connectionUrl.searchParams.set('sslmode', 'verify-full');
}

const adapter = new PrismaPg({
  connectionString: connectionUrl.toString(),
});

const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
  });
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
export default prisma;
