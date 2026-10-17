import assert from "node:assert/strict";
import {
  ContactProfileInputSchema,
  DEFAULT_CONTACT_PROFILE,
} from "../../src/lib/schemas/contact.schema";
import {
  getContactProfile,
  saveContactProfile,
} from "../../src/lib/repositories/contact.repo";
import {
  GET as getContactRoute,
  PUT as putContactRoute,
} from "../../src/app/api/contact/route";

export async function runContactProfileTests(): Promise<void> {
  // 1. Validate default ITE Computer profile schema
  const parsedDefault = ContactProfileInputSchema.safeParse(DEFAULT_CONTACT_PROFILE);
  assert.equal(parsedDefault.success, true, "Default ITE Computer contact profile must pass Zod validation");
  assert.equal(DEFAULT_CONTACT_PROFILE.companyName, "ITE Computer");

  // 2. Reject invalid URLs or empty company name
  const invalidUrl = ContactProfileInputSchema.safeParse({
    ...DEFAULT_CONTACT_PROFILE,
    websiteUrl: "not-a-valid-url",
  });
  assert.equal(invalidUrl.success, false, "Invalid websiteUrl must fail Zod validation");

  const emptyName = ContactProfileInputSchema.safeParse({
    ...DEFAULT_CONTACT_PROFILE,
    companyName: "   ",
  });
  assert.equal(emptyName.success, false, "Blank companyName must fail Zod validation");

  // 3. Repository getContactProfile seeds/migrates default ITE Computer record
  const initialProfile = await getContactProfile();
  assert.equal(initialProfile.companyName, "ITE Computer");
  assert.equal(initialProfile.websiteUrl.startsWith("http"), true);
  assert.equal(initialProfile.lineUrl.startsWith("http"), true);
  assert.equal(initialProfile.facebookUrl.startsWith("http"), true);
  assert.equal(initialProfile.instagramUrl.startsWith("http"), true);
  assert.equal(initialProfile.tiktokUrl.startsWith("http"), true);

  // 4. Repository saveContactProfile updates all 5 social links and company details
  const updatedProfile = await saveContactProfile({
    ...DEFAULT_CONTACT_PROFILE,
    companyName: "ITE Computer",
    websiteUrl: "https://www.itecomputer.com",
    websiteLabel: "www.itecomputer.com",
    lineUrl: "https://lin.ee/zW8Iu4s",
    lineLabel: "@itecomputer",
    facebookUrl: "https://www.facebook.com/itecomputer",
    facebookLabel: "ITE Computer",
    instagramUrl: "https://www.instagram.com/itecomputer",
    instagramLabel: "@itecomputer",
    tiktokUrl: "https://www.tiktok.com/@itecomputer",
    tiktokLabel: "@itecomputer",
  });
  assert.equal(updatedProfile.companyName, "ITE Computer");
  assert.equal(updatedProfile.tiktokLabel, "@itecomputer");

  // 5. API Route GET & PUT /api/contact
  const getRes = await getContactRoute();
  assert.equal(getRes.status, 200);
  const getBody = (await getRes.json()) as { profile: { companyName: string } };
  assert.equal(getBody.profile.companyName, "ITE Computer");

  const badPutRes = await putContactRoute(
    new Request("http://localhost:3000/api/contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...DEFAULT_CONTACT_PROFILE, facebookUrl: "bad-url" }),
    })
  );
  assert.equal(badPutRes.status, 400);

  const okPutRes = await putContactRoute(
    new Request("http://localhost:3000/api/contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEFAULT_CONTACT_PROFILE),
    })
  );
  assert.equal(okPutRes.status, 200);

  console.log("  ✓ ITE Computer Contact Profile Schema, Repository & API Routes passed");
}
