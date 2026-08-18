import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/oms";

  try {
    const url = new URL(databaseUrl);
    const adapter = new PrismaMariaDb({
      host: url.hostname || "127.0.0.1",
      port: url.port ? parseInt(url.port, 10) : 3306,
      user: decodeURIComponent(url.username || "root"),
      password: decodeURIComponent(url.password || ""),
      database: url.pathname.replace(/^\//, "") || "oms",
      connectionLimit: 10,
      connectTimeout: 10000,
    });
    return new PrismaClient({ adapter });
  } catch {
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function getPrismaClient(): PrismaClient {
  return prisma;
}

export default prisma;