import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const site = await prisma.site.findUnique({
      where: { id },
      include: { bundle: true },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7");
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    dateFrom.setHours(0, 0, 0, 0);

    const dailyStats = await prisma.dailyStat.findMany({
      where: { siteId: id, statDate: { gte: dateFrom } },
      orderBy: { statDate: "asc" },
    });

    const formatStats = await prisma.dailyFormatStat.findMany({
      where: { siteId: id, statDate: { gte: dateFrom } },
      orderBy: { statDate: "desc" },
    });

    const latestStat = dailyStats[dailyStats.length - 1];
    const prevStat = dailyStats.length > 1 ? dailyStats[dailyStats.length - 2] : null;

    const latestFormats = formatStats.filter(
      (f) => latestStat && f.statDate.getTime() === latestStat.statDate.getTime()
    );

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        bundle: { code: site.bundle.code, name: site.bundle.name },
      },
      current: latestStat
        ? {
            traffic: latestStat.traffic,
            revenue: Number(latestStat.revenue),
            costs: Number(latestStat.costs),
            profit: Number(latestStat.profit),
            romi: Number(latestStat.romi),
            revenuePer1000: Number(latestStat.revenuePer1000),
            healthScore: latestStat.healthScore,
            healthStatus: latestStat.healthStatus,
          }
        : null,
      previous: prevStat
        ? {
            traffic: prevStat.traffic,
            revenue: Number(prevStat.revenue),
            costs: Number(prevStat.costs),
            profit: Number(prevStat.profit),
            romi: Number(prevStat.romi),
          }
        : null,
      formats: latestFormats.map((f) => ({
        name: f.formatName,
        revenue: Number(f.revenue),
        traffic: f.traffic,
        revenuePer1000: Number(f.revenuePer1000),
        sharePercent: Number(f.sharePercent),
      })),
      trends: dailyStats.map((s) => ({
        date: s.statDate.toISOString().split("T")[0],
        traffic: s.traffic,
        revenue: Number(s.revenue),
        costs: Number(s.costs),
        profit: Number(s.profit),
        healthScore: s.healthScore,
      })),
    });
  } catch (error) {
    console.error("Site detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
