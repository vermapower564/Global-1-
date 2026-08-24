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
  const url1 = "mysql://4BrXAABTf5SQeKq.root:oF5rWQth8eQANTqp@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/oms?sslaccept=strict";
  const url2 = "mysql://6Hb8G25JxJe8f6u.root:zuPRWC2S56szrQjX@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/oms?sslaccept=strict";

  await testUrl("Original TiDB Cluster (4BrXAABTf5SQeKq)", url1);
  await testUrl("New/Updated TiDB Cluster (6Hb8G25JxJe8f6u)", url2);
}

run();
