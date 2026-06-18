import { NextResponse } from "next/server";
import { z } from "zod";
import { applyEditorialAction, blacklistSource } from "@/lib/news-harvester/repository";

export const runtime = "nodejs";

const ActionSchema = z.object({
  queueId: z.string().min(1),
  action: z.enum(["approve", "reject", "merge", "assign_reporter", "blacklist_source"]),
  editorId: z.string().min(1).default("sample-editor"),
  note: z.string().optional(),
  targetClusterKey: z.string().optional(),
  reporterId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  reason: z.string().optional()
});

export async function POST(request: Request) {
  const payload = ActionSchema.parse(await request.json());

  await applyEditorialAction(payload);

  if (payload.action === "blacklist_source" && payload.sourceUrl) {
    await blacklistSource({
      sourceUrl: payload.sourceUrl,
      editorId: payload.editorId,
      reason: payload.reason || payload.note || "Blacklisted from editorial dashboard"
    });
  }

  return NextResponse.json({
    ok: true,
    message:
      payload.action === "approve"
        ? "Article approved for downstream editorial publishing workflow; no automatic publication occurred."
        : "Editorial action recorded."
  });
}
