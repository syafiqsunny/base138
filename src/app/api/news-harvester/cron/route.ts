import { NextResponse } from "next/server";
import { runNewsHarvest } from "@/lib/news-harvester/worker";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = validateCronSecret(request);
  if (!auth.ok) return auth.response;

  const result = await runNewsHarvest();
  return NextResponse.json({ ok: true, result });
}

export async function GET(request: Request) {
  return POST(request);
}

function validateCronSecret(request: Request): { ok: true } | { ok: false; response: NextResponse } {
  const expected = process.env.NEWS_HARVESTER_CRON_SECRET;
  if (!expected) return { ok: true };

  const url = new URL(request.url);
  const actual = request.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (actual === expected) return { ok: true };

  return {
    ok: false,
    response: NextResponse.json({ ok: false, error: "Unauthorized cron request" }, { status: 401 })
  };
}
