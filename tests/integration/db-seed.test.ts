import assert from "node:assert/strict";

try {
  process.loadEnvFile(".env");
} catch {
  // .env already loaded
}

import { GPO_SAMPLE_DOCUMENTS } from "../../src/lib/services/gpo-samples";
import { normalizeRawOcrPayload } from "../../src/lib/services/gpo-prompt";
import { saveDeliveryDocument } from "../../src/lib/repositories/document.repo";
import { getMasterDataOverview } from "../../src/lib/repositories/master-data.repo";
import { listDeliveryDocuments } from "../../src/lib/repositories/document-query.repo";

export async function runDatabaseIntegrationTests(): Promise<void> {
  for (const sample of GPO_SAMPLE_DOCUMENTS) {
    const normalized = normalizeRawOcrPayload(sample.payload, sample.imageUrl);
    normalized.status = "VERIFIED";
    normalized.overwriteExisting = true;
    const saved = await saveDeliveryDocument(normalized, null);
    assert.equal(saved.billingNo, sample.payload.billingNo);
  }

  const docs = await listDeliveryDocuments({ status: "ALL" });
  assert.equal(docs.length >= 3, true);

  const paracetamolDoc = docs.find((d) => d.billingNo === "3001275142");
  assert.ok(paracetamolDoc, "Billing 3001275142 must exist in Neon PostgreSQL");
  assert.equal(paracetamolDoc.items.length, 2);
  assert.equal(paracetamolDoc.items[0].lots.length, 2); // Q-606 and Q-605

  const master = await getMasterDataOverview();
  assert.equal(master.customers.length >= 2, true);
  assert.equal(master.products.length >= 4, true);

  console.log(
    `  ✓ Neon PostgreSQL Integration passed (${docs.length} Documents, ${master.customers.length} Customers, ${master.products.length} Drug Products stored)`
  );
}
