import { spawnSync, spawn } from "node:child_process";

const DEFAULT_COOLIFY_DB_URL = [
  "postgresql://postgres:",
  "JHr0VVp2ZFurZ6jsohtf5gCQ7Reh9JdyhI4rnR1uZq3p77ZbUab22RhevHnwjrXq",
  "@f5pkcxy4assvsu4s1dzwn9mt:5432/postgres",
].join("");

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
  process.env.DATABASE_URL = DEFAULT_COOLIFY_DB_URL;
}

console.log("[startup] Ensuring PostgreSQL schema is pushed (prisma db push)...");
const pushResult = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

if (pushResult.status !== 0) {
  console.warn("[startup] Warning: prisma db push returned non-zero status, continuing to start Next.js server...");
}

console.log("[startup] Starting Next.js production server...");
const server = spawn("npx", ["next", "start"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

server.on("exit", (code) => {
  process.exit(code ?? 0);
});
