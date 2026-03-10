import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (dateFrom && dateTo) {
      where.statDate = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      where.statDate = yesterday;
    }

    const bundleStats = await prisma.dailyBundleStat.findMany({
      where,
      include: { bundle: true },
      orderBy: { statDate: "desc" },
    });

    const siteStats = await prisma.dailyStat.findMany({
      where,
      include: { site: true, bundle: true },
    });

    const totals = {
      traffic: 0,
      revenue: 0,
      costs: 0,
      profit: 0,
      romi: 0,
      revenuePer1000: 0,
      healthyCounts: { healthy: 0, warning: 0, critical: 0 },
    };

    for (const stat of siteStats) {
      totals.traffic += stat.traffic;
      totals.revenue += Number(stat.revenue);
      totals.costs += Number(stat.costs);
      const status = stat.healthStatus as "healthy" | "warning" | "critical";
      if (totals.healthyCounts[status] !== undefined) {
        totals.healthyCounts[status]++;
      }
    }

    totals.profit = totals.revenue - totals.costs;
    totals.romi = totals.costs > 0 ? ((totals.revenue - totals.costs) / totals.costs) * 100 : 0;
    totals.revenuePer1000 = totals.traffic > 0 ? (totals.revenue / totals.traffic) * 1000 : 0;

    return NextResponse.json({
      totals,
      bundles: bundleStats.map((bs) => ({
        id: bs.bundle.id,
        code: bs.bundle.code,
        name: bs.bundle.name,
        traffic: bs.traffic,
        revenue: Number(bs.revenue),
        costs: Number(bs.costs),
        profit: Number(bs.profit),
        romi: Number(bs.romi),
        revenuePer1000: Number(bs.revenuePer1000),
        healthScore: bs.healthScore,
      })),
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
