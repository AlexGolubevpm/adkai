import { NextRequest, NextResponse } from "next/server";
import { asg, type AsgGroupBy } from "@/lib/adspyglass";

/**
 * GET /api/asg/report?from=YYYY-MM-DD&to=YYYY-MM-DD&group_by=website&website_id=123
 * Proxy to AdSpyGlass report API with auth handled server-side.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "from and to are required" }, { status: 400 });
    }

    const groupBy = sp.get("group_by") as AsgGroupBy | null;
    const websiteId = sp.get("website_id");

    const data = await asg.getReport({
      from,
      to,
      group_by: groupBy || undefined,
      website_id: websiteId ? parseInt(websiteId, 10) : undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("ASG report proxy error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
