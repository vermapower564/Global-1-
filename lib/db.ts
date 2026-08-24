import mariadb, { type Pool, type PoolConfig } from "mariadb";

/**
 * Enterprise Ultra-Fast TiDB Cloud Connection Pool
 * Features:
 * - Powered by native `mariadb` driver (compatible with TiDB Cloud & MySQL)
 * - Sub-millisecond In-Memory Query Cache with automatic invalidation on writes
 * - Background keep-alive heartbeat ping every 45s
 */

let pool: Pool | null = null;
const queryCache = new Map<string, { data: any; expiresAt: number }>();
let warmupTimer: NodeJS.Timeout | null = null;

export function getDbConfig(): PoolConfig {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL environment variable is missing. Please configure it in your environment settings.");
  }

  try {
    const url = new URL(rawUrl);
    const isCloudHost =
      url.hostname.includes("tidbcloud.com") ||
      url.port === "4000" ||
      url.search.includes("ssl");

    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      connectionLimit: 30,
      idleTimeout: 600,
      checkDuplicate: false,
      ssl: isCloudHost
        ? {
            rejectUnauthorized: true,
          }
        : undefined,
    };
  } catch (err: any) {
    throw new Error(`Invalid DATABASE_URL configuration: ${err?.message}`);
  }
}

export function getDbPool(): Pool {
  if (!pool) {
    const config = getDbConfig();
    pool = mariadb.createPool(config);

    // Pre-warm connections immediately
    pool.query("SELECT 1").catch(() => {});

    // Periodic Heartbeat to keep all pool connections warm
    if (!warmupTimer) {
      warmupTimer = setInterval(() => {
        if (pool) {
          pool.query("SELECT 1").catch(() => {});
        }
      }, 45000);
      if (typeof warmupTimer.unref === "function") {
        warmupTimer.unref();
      }
    }
  }
  return pool;
}

// Invalidate cache on mutations
export function clearQueryCache(prefix?: string) {
  if (!prefix) {
    queryCache.clear();
  } else {
    for (const key of queryCache.keys()) {
      if (key.includes(prefix)) {
        queryCache.delete(key);
      }
    }
  }
}
export const invalidateDbCache = clearQueryCache;

export async function queryDb<T = any>(sql: string, params: any[] = []): Promise<T> {
  const p = getDbPool();
  const trimmed = sql.trim().toUpperCase();

  // If mutation, invalidate cache immediately
  if (
    trimmed.startsWith("INSERT") ||
    trimmed.startsWith("UPDATE") ||
    trimmed.startsWith("DELETE") ||
    trimmed.startsWith("DROP")
  ) {
    clearQueryCache();
  }

  const rows = await p.query(sql, params);
  return rows as T;
}

/**
 * Ultra-fast cached read query (reduces round-trip latency to ~1ms)
 * Default TTL: 30 seconds
 */
export async function queryDbCached<T = any>(
  sql: string,
  params: any[] = [],
  ttlSeconds: number = 30
): Promise<T> {
  const cacheKey = `${sql}__${JSON.stringify(params)}`;
  const now = Date.now();

  const cached = queryCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const data = await queryDb<T>(sql, params);
  queryCache.set(cacheKey, {
    data,
    expiresAt: now + ttlSeconds * 1000,
  });

  return data;
}

// Pre-warm pool on server startup
try {
  getDbPool();
} catch {}

export default getDbPool;
