import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/forecast/sites?from=YYYY-MM-DD&to=YYYY-MM-DD&bundle=code
 *
 * Returns per-site metrics including CPM and impressions data needed for
 * revenue modeling and CPM sensitivity analysis.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const bundleCode = sp.get("bundle");
    const dateFrom = sp.get("from");
    const dateTo = sp.get("to");

    // Build date range
    let dateFilter: { statDate: { gte: Date; lte: Date } } | { statDate: Date };
    if (dateFrom && dateTo) {
      dateFilter = {
        statDate: {
          gte: new Date(dateFrom + "T00:00:00.000Z"),
          lte: new Date(dateTo + "T23:59:59.000Z"),
        },
      };
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      dateFilter = { statDate: yesterday };
    }

    // Find bundle if filtered
    let bundleId: string | undefined;
    if (bundleCode && bundleCode !== "all") {
      const bundle = await prisma.bundle.findUnique({ where: { code: bundleCode } });
      bundleId = bundle?.id;
    }

    const siteWhere: Record<string, unknown> = { isActive: true };
    if (bundleId) siteWhere.bundleId = bundleId;

    const sites = await prisma.site.findMany({
      where: siteWhere,
      include: { bundle: true },
      orderBy: { name: "asc" },
    });

    const results = [];

    for (const site of sites) {
      // Aggregate DailyStat rows over the period for this site
      const statsAgg = await prisma.dailyStat.aggregate({
        where: { siteId: site.id, ...dateFilter },
        _sum: {
          traffic: true,
          hits: true,
          impressions: true,
          revenue: true,
          costs: true,
          profit: true,
        },
        _avg: {
          realCpm: true,
          brokerCpm: true,
          fillRate: true,
          ctr: true,
          romi: true,
          revenuePer1000: true,
        },
      });

      const traffic = statsAgg._sum.traffic ?? 0;
      const hits = statsAgg._sum.hits ?? 0;
      const impressions = statsAgg._sum.impressions ?? 0;
      const revenue = Number(statsAgg._sum.revenue ?? 0);
      const costs = Number(statsAgg._sum.costs ?? 0);
      const profit = Number(statsAgg._sum.profit ?? 0);
      const realCpm = Number(statsAgg._avg.realCpm ?? 0);
      const brokerCpm = Number(statsAgg._avg.brokerCpm ?? 0);
      const fillRate = Number(statsAgg._avg.fillRate ?? 0);
      const ctr = Number(statsAgg._avg.ctr ?? 0);

      // Compute ROMI from aggregated sums (more accurate than avg of romi)
      const romi = costs > 0 ? ((revenue - costs) / costs) * 100 : 0;
      const revenuePer1000 = traffic > 0 ? (revenue / traffic) * 1000 : 0;

      // Computed breakeven CPM from real impressions (if available)
      const breakevenCpm = impressions > 0 ? (costs * 1000) / impressions : null;

      results.push({
        id: site.id,
        name: site.name,
        slug: site.slug,
        bundle: { code: site.bundle.code, name: site.bundle.name },
        traffic,
        hits,
        impressions,
        fillRate,
        ctr,
        realCpm,
        brokerCpm,
        revenue,
        costs,
        profit,
        romi,
        revenuePer1000,
        breakevenCpm,
      });
    }

    // Totals
    const totalImpressions = results.reduce((s, r) => s + r.impressions, 0);
    const totalRevenue = results.reduce((s, r) => s + r.revenue, 0);
    const totalCosts = results.reduce((s, r) => s + r.costs, 0);
    const totalTraffic = results.reduce((s, r) => s + r.traffic, 0);
    const totalHits = results.reduce((s, r) => s + r.hits, 0);

    // Impression-weighted average CPM
    const avgRealCpm =
      totalImpressions > 0 ? (totalRevenue * 1000) / totalImpressions : 0;

    const totals = {
      traffic: totalTraffic,
      hits: totalHits,
      impressions: totalImpressions,
      revenue: totalRevenue,
      costs: totalCosts,
      profit: totalRevenue - totalCosts,
      romi: totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0,
      avgRealCpm,
      revenuePer1000: totalTraffic > 0 ? (totalRevenue / totalTraffic) * 1000 : 0,
      breakevenCpm:
        totalImpressions > 0 ? (totalCosts * 1000) / totalImpressions : null,
    };

    return NextResponse.json({ sites: results, totals });
  } catch (error) {
    console.error("Forecast API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
