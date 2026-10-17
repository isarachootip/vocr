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
  // 1. Validate default ITE Compute profile schema
  const parsedDefault = ContactProfileInputSchema.safeParse(DEFAULT_CONTACT_PROFILE);
  assert.equal(parsedDefault.success, true, "Default ITE Compute contact profile must pass Zod validation");

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

  // 3. Repository getContactProfile seeds default ITE Compute record
  const initialProfile = await getContactProfile();
  assert.equal(initialProfile.companyName.includes("ITE"), true);
  assert.equal(initialProfile.websiteUrl.startsWith("http"), true);
  assert.equal(initialProfile.lineUrl.startsWith("http"), true);
  assert.equal(initialProfile.facebookUrl.startsWith("http"), true);
  assert.equal(initialProfile.instagramUrl.startsWith("http"), true);
  assert.equal(initialProfile.tiktokUrl.startsWith("http"), true);

  // 4. Repository saveContactProfile updates all 5 social links and company details
  const updatedProfile = await saveContactProfile({
    ...DEFAULT_CONTACT_PROFILE,
    companyName: "ITE Compute",
    websiteUrl: "https://www.itecompute.com",
    websiteLabel: "www.itecompute.com",
    lineUrl: "https://lin.ee/zW8Iu4s",
    lineLabel: "@itecompute",
    facebookUrl: "https://www.facebook.com/itecompute",
    facebookLabel: "ITE Compute",
    instagramUrl: "https://www.instagram.com/itecompute",
    instagramLabel: "@itecompute",
    tiktokUrl: "https://www.tiktok.com/@itecompute",
    tiktokLabel: "@itecompute",
  });
  assert.equal(updatedProfile.companyName, "ITE Compute");
  assert.equal(updatedProfile.tiktokLabel, "@itecompute");

  // 5. API Route GET & PUT /api/contact
  const getRes = await getContactRoute();
  assert.equal(getRes.status, 200);
  const getBody = (await getRes.json()) as { profile: { companyName: string } };
  assert.equal(getBody.profile.companyName, "ITE Compute");

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

  console.log("  ✓ ITE Compute Contact Profile Schema, Repository & API Routes passed");
}
