import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const bundleCode = searchParams.get("bundle");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    const search = searchParams.get("search");

    const siteWhere: Record<string, unknown> = { isActive: true };
    if (bundleCode) {
      const bundle = await prisma.bundle.findUnique({ where: { code: bundleCode } });
      if (bundle) siteWhere.bundleId = bundle.id;
    }
    if (search) {
      siteWhere.name = { contains: search, mode: "insensitive" };
    }

    const sites = await prisma.site.findMany({
      where: siteWhere,
      include: { bundle: true },
    });

    const statsWhere: Record<string, unknown> = {};
    if (dateFrom && dateTo) {
      statsWhere.statDate = { gte: new Date(dateFrom), lte: new Date(dateTo) };
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      statsWhere.statDate = yesterday;
    }

    const result = [];
    for (const site of sites) {
      const stats = await prisma.dailyStat.findMany({
        where: { siteId: site.id, ...statsWhere },
        orderBy: { statDate: "desc" },
        take: 1,
      });

      const stat = stats[0];
      result.push({
        id: site.id,
        name: site.name,
        slug: site.slug,
        bundle: { code: site.bundle.code, name: site.bundle.name },
        traffic: stat?.traffic || 0,
        revenue: stat ? Number(stat.revenue) : 0,
        costs: stat ? Number(stat.costs) : 0,
        profit: stat ? Number(stat.profit) : 0,
        romi: stat ? Number(stat.romi) : 0,
        revenuePer1000: stat ? Number(stat.revenuePer1000) : 0,
        healthScore: stat?.healthScore || 0,
        healthStatus: stat?.healthStatus || "critical",
      });
    }

    return NextResponse.json({ sites: result });
  } catch (error) {
    console.error("Sites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
