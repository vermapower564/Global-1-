import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || "mysql://root:@localhost:3306/oms";
  const adapter = new PrismaMariaDb(connectionString);
  return new PrismaClient({ adapter });
}

export function getPrismaClient(): PrismaClient {
  if (typeof window !== "undefined") {
    throw new Error("PrismaClient cannot be executed on the client side.");
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export const prisma =
  globalForPrisma.prisma ??
  (typeof window === "undefined" ? createClient() : (null as unknown as PrismaClient));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;