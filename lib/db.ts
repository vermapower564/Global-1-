import mysql from "mysql2/promise";

/**
 * Enterprise TiDB / Cloud Database Connection Pool
 * Automatically parses process.env.DATABASE_URL with SSL support for TiDB Cloud.
 */

let pool: mysql.Pool | null = null;

export function getDbConfig() {
  const rawUrl =
    process.env.DATABASE_URL ||
    "mysql://4BrXAABTf5SQeKq.root:nGi46nlizXdJsS0a@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/oms?sslaccept=strict";

  try {
    const url = new URL(rawUrl);
    const isCloudHost = url.hostname.includes("tidbcloud.com") || url.port === "4000" || url.search.includes("ssl");

    return {
      host: url.hostname || "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
      port: url.port ? parseInt(url.port, 10) : 4000,
      user: decodeURIComponent(url.username || "4BrXAABTf5SQeKq.root"),
      password: decodeURIComponent(url.password || "nGi46nlizXdJsS0a"),
      database: url.pathname.replace(/^\//, "") || "oms",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: isCloudHost
        ? {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
          }
        : undefined,
    };
  } catch {
    return {
      host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
      port: 4000,
      user: "4BrXAABTf5SQeKq.root",
      password: "nGi46nlizXdJsS0a",
      database: "oms",
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    };
  }
}

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const config = getDbConfig();
    pool = mysql.createPool(config);
  }
  return pool;
}

export async function queryDb<T = any>(sql: string, params: any[] = []): Promise<T> {
  const p = getDbPool();
  const [rows] = await p.execute(sql, params);
  return rows as T;
}

export default getDbPool;
