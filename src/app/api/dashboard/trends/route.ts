import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7");

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    dateFrom.setHours(0, 0, 0, 0);

    const bundleStats = await prisma.dailyBundleStat.findMany({
      where: { statDate: { gte: dateFrom } },
      include: { bundle: true },
      orderBy: { statDate: "asc" },
    });

    const trendsByDate: Record<string, {
      date: string;
      revenue: number;
      costs: number;
      profit: number;
      romi: number;
      traffic: number;
    }> = {};

    for (const stat of bundleStats) {
      const dateKey = stat.statDate.toISOString().split("T")[0];
      if (!trendsByDate[dateKey]) {
        trendsByDate[dateKey] = {
          date: dateKey,
          revenue: 0,
          costs: 0,
          profit: 0,
          romi: 0,
          traffic: 0,
        };
      }
      trendsByDate[dateKey].revenue += Number(stat.revenue);
      trendsByDate[dateKey].costs += Number(stat.costs);
      trendsByDate[dateKey].profit += Number(stat.profit);
      trendsByDate[dateKey].traffic += stat.traffic;
    }

    const trends = Object.values(trendsByDate);
    for (const t of trends) {
      t.romi = t.costs > 0 ? ((t.revenue - t.costs) / t.costs) * 100 : 0;
    }

    return NextResponse.json({ trends });
  } catch (error) {
    console.error("Dashboard trends error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
