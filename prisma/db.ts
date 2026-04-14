import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
    transactionOptions: {
      maxWait: 10000,
      timeout: 30000,
    },
  });
}

export const db = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

/**
 * Wraps a Prisma call with automatic retry on connection errors.
 * Neon serverless databases cold-start on first request — this retries up to
 * 3 times with a short delay so the page doesn't crash on wake-up.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // P1001 = can't reach server, P1008 = timeout, P1017 = server closed
      // Also catch PrismaClientInitializationError (no code property)
      const code: string | undefined = err?.code;
      const isConnErr =
        code === "P1001" || code === "P1008" || code === "P1017" ||
        err?.name === "PrismaClientInitializationError" ||
        (typeof err?.message === "string" && err.message.includes("Can't reach database"));

      if (isConnErr && attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
