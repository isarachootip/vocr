import { prisma } from "../db/prisma";
import {
  DEFAULT_LINE_CONFIG,
  LineOaConfigInputSchema,
  type LineOaConfigInput,
  type LineOaConfigRecord,
} from "../schemas/line.schema";

let schemaEnsured = false;

/**
 * Ensures the line_oa_configs table and LINE columns on delivery_documents exist
 * in PostgreSQL even if `prisma db push` was skipped in restricted network environments.
 */
export async function ensureLineDatabaseSchema(): Promise<void> {
  if (schemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "line_oa_configs" (
        "id" TEXT NOT NULL DEFAULT 'default',
        "channel_id" TEXT NOT NULL,
        "channel_secret" TEXT NOT NULL,
        "channel_access_token" TEXT NOT NULL,
        "oa_url" TEXT NOT NULL DEFAULT 'https://lin.ee/zW8Iu4s',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "auto_reply_flex" BOOLEAN NOT NULL DEFAULT true,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "line_oa_configs_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "delivery_documents"
      ADD COLUMN IF NOT EXISTS "source_channel" TEXT NOT NULL DEFAULT 'WEB',
      ADD COLUMN IF NOT EXISTS "line_user_id" TEXT,
      ADD COLUMN IF NOT EXISTS "line_display_name" TEXT;
    `);
    schemaEnsured = true;
  } catch {
    // Ignore if already exists or handled by migration
  }
}

export async function getLineOaConfig(): Promise<LineOaConfigRecord> {
  await ensureLineDatabaseSchema();

  const existing = await prisma.lineOaConfig.findUnique({
    where: { id: "default" },
  });

  if (existing) {
    return {
      id: existing.id,
      channelId: existing.channelId,
      channelSecret: existing.channelSecret,
      channelAccessToken: existing.channelAccessToken,
      oaUrl: existing.oaUrl,
      isActive: existing.isActive,
      autoReplyFlex: existing.autoReplyFlex,
      updatedAt: existing.updatedAt.toISOString(),
    };
  }

  const seeded = await prisma.lineOaConfig.create({
    data: {
      id: "default",
      channelId: process.env.LINE_CHANNEL_ID || DEFAULT_LINE_CONFIG.channelId,
      channelSecret:
        process.env.LINE_CHANNEL_SECRET || DEFAULT_LINE_CONFIG.channelSecret,
      channelAccessToken:
        process.env.LINE_CHANNEL_ACCESS_TOKEN ||
        DEFAULT_LINE_CONFIG.channelAccessToken,
      oaUrl: process.env.LINE_OA_URL || DEFAULT_LINE_CONFIG.oaUrl,
      isActive: true,
      autoReplyFlex: true,
    },
  });

  return {
    id: seeded.id,
    channelId: seeded.channelId,
    channelSecret: seeded.channelSecret,
    channelAccessToken: seeded.channelAccessToken,
    oaUrl: seeded.oaUrl,
    isActive: seeded.isActive,
    autoReplyFlex: seeded.autoReplyFlex,
    updatedAt: seeded.updatedAt.toISOString(),
  };
}

export async function saveLineOaConfig(
  input: LineOaConfigInput
): Promise<LineOaConfigRecord> {
  await ensureLineDatabaseSchema();
  const validated = LineOaConfigInputSchema.parse(input);

  const saved = await prisma.lineOaConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...validated,
    },
    update: {
      ...validated,
    },
  });

  return {
    id: saved.id,
    channelId: saved.channelId,
    channelSecret: saved.channelSecret,
    channelAccessToken: saved.channelAccessToken,
    oaUrl: saved.oaUrl,
    isActive: saved.isActive,
    autoReplyFlex: saved.autoReplyFlex,
    updatedAt: saved.updatedAt.toISOString(),
  };
}
