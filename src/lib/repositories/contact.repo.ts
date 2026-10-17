import { prisma } from "../db/prisma";
import {
  DEFAULT_CONTACT_PROFILE,
  ContactProfileInputSchema,
  type ContactProfileInput,
  type ContactProfileRecord,
} from "../schemas/contact.schema";

let schemaEnsured = false;

/**
 * Ensures the contact_profiles table exists in PostgreSQL even if
 * migrations were not manually applied.
 */
export async function ensureContactDatabaseSchema(): Promise<void> {
  if (schemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "contact_profiles" (
        "id" TEXT NOT NULL DEFAULT 'default',
        "company_name" TEXT NOT NULL,
        "tagline" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "business_hours" TEXT NOT NULL,
        "website_url" TEXT NOT NULL,
        "website_label" TEXT NOT NULL,
        "line_url" TEXT NOT NULL,
        "line_label" TEXT NOT NULL,
        "facebook_url" TEXT NOT NULL,
        "facebook_label" TEXT NOT NULL,
        "instagram_url" TEXT NOT NULL,
        "instagram_label" TEXT NOT NULL,
        "tiktok_url" TEXT NOT NULL,
        "tiktok_label" TEXT NOT NULL,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "contact_profiles_pkey" PRIMARY KEY ("id")
      );
    `);
    schemaEnsured = true;
  } catch {
    // Ignore if already exists
  }
}

function mapEntityToRecord(entity: {
  id: string;
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  websiteUrl: string;
  websiteLabel: string;
  lineUrl: string;
  lineLabel: string;
  facebookUrl: string;
  facebookLabel: string;
  instagramUrl: string;
  instagramLabel: string;
  tiktokUrl: string;
  tiktokLabel: string;
  updatedAt: Date;
}): ContactProfileRecord {
  return {
    id: entity.id,
    companyName: entity.companyName,
    tagline: entity.tagline,
    phone: entity.phone,
    email: entity.email,
    address: entity.address,
    businessHours: entity.businessHours,
    websiteUrl: entity.websiteUrl,
    websiteLabel: entity.websiteLabel,
    lineUrl: entity.lineUrl,
    lineLabel: entity.lineLabel,
    facebookUrl: entity.facebookUrl,
    facebookLabel: entity.facebookLabel,
    instagramUrl: entity.instagramUrl,
    instagramLabel: entity.instagramLabel,
    tiktokUrl: entity.tiktokUrl,
    tiktokLabel: entity.tiktokLabel,
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export async function getContactProfile(): Promise<ContactProfileRecord> {
  await ensureContactDatabaseSchema();

  const existing = await prisma.contactProfile.findUnique({
    where: { id: "default" },
  });

  if (existing) {
    return mapEntityToRecord(existing);
  }

  const seeded = await prisma.contactProfile.create({
    data: {
      id: "default",
      ...DEFAULT_CONTACT_PROFILE,
    },
  });

  return mapEntityToRecord(seeded);
}

export async function saveContactProfile(
  input: ContactProfileInput
): Promise<ContactProfileRecord> {
  await ensureContactDatabaseSchema();
  const validated = ContactProfileInputSchema.parse(input);

  const saved = await prisma.contactProfile.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...validated,
    },
    update: {
      ...validated,
    },
  });

  return mapEntityToRecord(saved);
}
