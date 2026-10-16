import { runNormalizerTests } from "./domain/normalizer.test";
import { runDocumentValidatorTests } from "./domain/document-validator.test";
import { runDocumentMergerTests } from "./domain/document-merger.test";
import { runOcrNormalizerTests } from "./domain/ocr-normalizer.test";
import { runDatabaseIntegrationTests } from "./integration/db-seed.test";
import { runUserCrudTests } from "./integration/user-crud.test";

async function main(): Promise<void> {
  console.log("Running GPO OCR Domain & Database Test Suite...");
  runNormalizerTests();
  runDocumentValidatorTests();
  runDocumentMergerTests();
  runOcrNormalizerTests();
  await runDatabaseIntegrationTests();
  await runUserCrudTests();
  console.log("All unit & database integration tests passed 100%!");
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
