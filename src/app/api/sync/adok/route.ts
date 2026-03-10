import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sync/adok — redirects to /api/sync/adspyglass
 * Kept for backwards compatibility.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const url = new URL("/api/sync/adspyglass", req.url);
  return fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).then((r) => new NextResponse(r.body, { status: r.status, headers: r.headers }));
}
