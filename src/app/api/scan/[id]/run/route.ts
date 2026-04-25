import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runPendingScan } from "@/lib/scan-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();

  const result = await runPendingScan({
    scanId: id,
    userId: session?.user?.id ?? null,
  });

  if (!result.ok && result.status === 404) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!result.ok && result.status === 403) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!result.ok) {
    return NextResponse.json({
      scanId: result.scanId,
      status: "FAILED",
      error: result.error,
    }, { status: 500 });
  }

  return NextResponse.json(result);
}
