import { PrismaClient } from "@prisma/client";

async function testUrl(label: string, url: string) {
  console.log(`\nTesting connection for: ${label}...`);
  const client = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });

  try {
    const res: any = await client.$queryRaw`SELECT 1 as connected`;
    console.log(`✓ ${label} SUCCESS! Result:`, res);
    const userCount = await client.user.count();
    console.log(`✓ ${label} User count: ${userCount}`);
    await client.$disconnect();
    return true;
  } catch (err: any) {
    console.error(`✗ ${label} FAILED:`, err?.message || err);
    await client.$disconnect();
    return false;
  }
}

async function run() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    console.log("No DATABASE_URL found in environment variables.");
    return;
  }

  await testUrl("Current Database Connection", dbUrl);
}

run();
