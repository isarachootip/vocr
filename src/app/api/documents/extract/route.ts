import { NextResponse } from "next/server";
import { extractGpoDocumentFromImage } from "@/lib/services/gemini-ocr.service";
import { mergeMultiPageDocuments } from "@/lib/domain/document-merger";
import { validateDeliveryDocument } from "@/lib/domain/document-validator";
import type { DeliveryDocumentInput } from "@/lib/schemas/document.schema";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const extractedDocs: DeliveryDocumentInput[] = [];
    const enginesUsed = new Set<string>();

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        sampleIds?: string[];
        apiKey?: string;
      };
      const sampleIds = body.sampleIds ?? [];
      if (sampleIds.length === 0) {
        return NextResponse.json(
          { error: "กรุณาเลือกใบส่งของตัวอย่างอย่างน้อย 1 ใบ" },
          { status: 400 }
        );
      }

      for (const sampleId of sampleIds) {
        const res = await extractGpoDocumentFromImage({
          sampleId,
          imageUrl: `/samples/gpo-${sampleId}.jpg`,
          apiKeyOverride: body.apiKey,
        });
        extractedDocs.push(res.document);
        enginesUsed.add(res.engine);
      }
    } else {
      const formData = await request.formData();
      const files = formData.getAll("files") as File[];
      const apiKey = (formData.get("apiKey") as string | null) ?? undefined;

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: "ไม่พบไฟล์รูปภาพที่อัปโหลด" },
          { status: 400 }
        );
      }

      for (const file of files) {
        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const mimeType = file.type || "image/jpeg";
        const base64Image = buffer.toString("base64");
        const imageUrl = `data:${mimeType};base64,${base64Image}`;

        const res = await extractGpoDocumentFromImage({
          imageBuffer: buffer,
          mimeType,
          imageUrl,
          fileName: file.name,
          apiKeyOverride: apiKey,
        });
        extractedDocs.push(res.document);
        enginesUsed.add(res.engine);
      }
    }

    const mergedDocs = mergeMultiPageDocuments(extractedDocs);
    const results = mergedDocs.map((doc) => ({
      document: doc,
      validation: validateDeliveryDocument(doc),
    }));

    return NextResponse.json({
      results,
      engines: Array.from(enginesUsed),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสกัดข้อมูลจากรูปภาพ";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
