import { NextResponse } from "next/server";
import { z } from "zod";
import { runPendingScan } from "@/lib/scan-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const Body = z.object({
  scanId: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const secret = process.env.SCAN_WORKER_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "SCAN_WORKER_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing scanId" }, { status: 400 });
  }

  const result = await runPendingScan({
    scanId: parsed.data.scanId,
    bypassOwnership: true,
  });

  if (!result.ok && result.status === 404) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!result.ok && result.status === 403) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!result.ok) {
    return NextResponse.json(
      { scanId: result.scanId, status: "FAILED", error: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}
