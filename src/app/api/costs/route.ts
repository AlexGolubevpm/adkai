import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const bundleCode = searchParams.get("bundle");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (bundleCode) {
      const bundle = await prisma.bundle.findUnique({ where: { code: bundleCode } });
      if (bundle) where.bundleId = bundle.id;
    }

    if (dateFrom && dateTo) {
      where.statDate = { gte: new Date(dateFrom), lte: new Date(dateTo) };
    }

    const costs = await prisma.costDaily.findMany({
      where,
      include: { site: true, bundle: true },
      orderBy: { statDate: "desc" },
    });

    return NextResponse.json({
      costs: costs.map((c) => ({
        id: c.id,
        date: c.statDate.toISOString().split("T")[0],
        siteName: c.site.name,
        bundleCode: c.bundle.code,
        bundleName: c.bundle.name,
        cost: Number(c.costValue),
        source: c.sourceType,
        sourceRowKey: c.sourceRowKey,
        syncedAt: c.syncedAt,
      })),
    });
  } catch (error) {
    console.error("Costs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
