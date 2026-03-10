import { NextRequest, NextResponse } from "next/server";
import { asg } from "@/lib/adspyglass";

/**
 * GET /api/asg/website/[id]?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns daily breakdown + spot breakdown for a specific website.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const websiteId = parseInt(id, 10);
    if (isNaN(websiteId)) {
      return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });
    }

    const sp = req.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "from and to are required" }, { status: 400 });
    }

    const [daily, spots] = await Promise.all([
      asg.getDailyReport(from, to, websiteId),
      asg.getSpotReport(from, to, websiteId),
    ]);

    return NextResponse.json({
      daily: daily.map((d) => ({
        date: d.name,
        hits: d.hits,
        clicks: d.clicks,
        impressions: d.impressions,
        brokerIncome: d.broker_income,
        predictedIncome: d.predicted_income,
        ctr: d.ctr,
        fillRate: d.fill_rate,
        realCpm: d.real_cpm,
      })),
      spots: spots.map((s) => ({
        externalId: s.externalId,
        name: s.spotName,
        domain: s.domain,
        hits: s.hits,
        clicks: s.clicks,
        impressions: s.impressions,
        brokerIncome: s.broker_income,
        ctr: s.ctr,
        fillRate: s.fill_rate,
        realCpm: s.real_cpm,
      })),
    });
  } catch (error) {
    console.error("ASG website detail error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
