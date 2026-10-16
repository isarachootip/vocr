import dns from "node:dns";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Force IPv4 resolution first on Windows networks where IPv6 to AWS times out
dns.setDefaultResultOrder("ipv4first");
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const DEFAULT_COOLIFY_DB_URL = [
  "postgresql://postgres:",
  "JHr0VVp2ZFurZ6jsohtf5gCQ7Reh9JdyhI4rnR1uZq3p77ZbUab22RhevHnwjrXq",
  "@f5pkcxy4assvsu4s1dzwn9mt:5432/postgres",
].join("");

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
    process.env.DATABASE_URL = DEFAULT_COOLIFY_DB_URL;
  }
  const connectionString = process.env.DATABASE_URL;
  if (connectionString.includes(".neon.tech")) {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient({
    datasources: { db: { url: connectionString } },
  });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
