import type {
  DeliveryDocumentInput,
  ValidationSummary,
} from "../schemas/document.schema";
import { validateDeliveryDocument } from "./document-validator";

export interface QueueItemAnalysis {
  isValid: boolean;
  isDuplicate: boolean;
  canBatchSave: boolean;
  validation: ValidationSummary;
}

export interface BatchSavePartition {
  saveable: DeliveryDocumentInput[];
  remaining: DeliveryDocumentInput[];
}

export interface QueueRemovalResult {
  nextQueue: DeliveryDocumentInput[];
  nextActiveIdx: number;
}

export function analyzeQueueItem(
  doc: DeliveryDocumentInput,
  existingBillingNos: ReadonlySet<string>
): QueueItemAnalysis {
  const validation = validateDeliveryDocument(doc);
  const isDuplicate = existingBillingNos.has(doc.billingNo.trim());
  const canBatchSave = validation.isValid && !isDuplicate;

  return {
    isValid: validation.isValid,
    isDuplicate,
    canBatchSave,
    validation,
  };
}

export function partitionBatchSaveQueue(
  queue: readonly DeliveryDocumentInput[],
  existingBillingNos: ReadonlySet<string>
): BatchSavePartition {
  const saveable: DeliveryDocumentInput[] = [];
  const remaining: DeliveryDocumentInput[] = [];

  for (const doc of queue) {
    const analysis = analyzeQueueItem(doc, existingBillingNos);
    if (analysis.canBatchSave) {
      saveable.push(doc);
    } else {
      remaining.push(doc);
    }
  }

  return { saveable, remaining };
}

export function removeQueueItemAtIndex(
  queue: readonly DeliveryDocumentInput[],
  removeIdx: number,
  currentActiveIdx: number
): QueueRemovalResult {
  const nextQueue = queue.filter((_, idx) => idx !== removeIdx);
  if (nextQueue.length === 0) {
    return { nextQueue: [], nextActiveIdx: 0 };
  }
  const clampedIdx = Math.min(currentActiveIdx, nextQueue.length - 1);
  return {
    nextQueue,
    nextActiveIdx: Math.max(0, clampedIdx),
  };
}
