import { NextRequest, NextResponse } from "next/server";
import { asg } from "@/lib/adspyglass";

/**
 * GET /api/asg/websites?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns all websites with their stats for the given period.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "from and to are required" }, { status: 400 });
    }

    const websites = await asg.getWebsiteReport(from, to);

    return NextResponse.json(
      websites.map((w) => ({
        externalId: w.externalId,
        domain: w.domain,
        hits: w.hits,
        clicks: w.clicks,
        impressions: w.impressions,
        brokerIncome: w.broker_income,
        predictedIncome: w.predicted_income,
        ctr: w.ctr,
        fillRate: w.fill_rate,
        realCpm: w.real_cpm,
        brokerCpm: w.broker_cpm,
        brokerCtr: w.broker_ctr,
        discrepancy: w.discrepancy,
      }))
    );
  } catch (error) {
    console.error("ASG websites error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
