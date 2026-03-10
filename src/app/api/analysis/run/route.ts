import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { from, to } = await req.json().catch(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split("T")[0];
      return { from: dateStr, to: dateStr };
    });

    const periodFrom = new Date(from);
    const periodTo = new Date(to);
    periodFrom.setHours(0, 0, 0, 0);
    periodTo.setHours(0, 0, 0, 0);

    // Gather aggregated data for AI
    const bundleStats = await prisma.dailyBundleStat.findMany({
      where: { statDate: { gte: periodFrom, lte: periodTo } },
      include: { bundle: true },
    });

    const siteStats = await prisma.dailyStat.findMany({
      where: { statDate: { gte: periodFrom, lte: periodTo } },
      include: { site: { include: { bundle: true } } },
    });

    const formatStats = await prisma.dailyFormatStat.findMany({
      where: { statDate: { gte: periodFrom, lte: periodTo } },
    });

    // Build context payload for OpenClaw
    const context = {
      period: { from, to },
      bundles: bundleStats.map((bs) => ({
        bundle: bs.bundle.code,
        traffic: bs.traffic,
        revenue: Number(bs.revenue),
        costs: Number(bs.costs),
        profit: Number(bs.profit),
        romi: Number(bs.romi),
        revenuePer1000: Number(bs.revenuePer1000),
        healthScore: bs.healthScore,
      })),
      sites: siteStats.map((ss) => ({
        site: ss.site.name,
        bundle: ss.site.bundle.code,
        traffic: ss.traffic,
        revenue: Number(ss.revenue),
        costs: Number(ss.costs),
        profit: Number(ss.profit),
        romi: Number(ss.romi),
        healthScore: ss.healthScore,
        healthStatus: ss.healthStatus,
      })),
      formats: formatStats.map((fs) => ({
        format: fs.formatName,
        revenue: Number(fs.revenue),
        share: Number(fs.sharePercent),
        rpm: Number(fs.revenuePer1000),
      })),
    };

    // Send to OpenClaw
    const openclawUrl = process.env.OPENCLAW_API_URL;
    const openclawKey = process.env.OPENCLAW_API_KEY;

    let responsePayload = null;
    let summaryText = "AI analysis not configured. Please set OPENCLAW_API_URL and OPENCLAW_API_KEY.";

    if (openclawUrl && openclawKey) {
      const aiResponse = await fetch(`${openclawUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openclawKey}`,
        },
        body: JSON.stringify({
          prompt: "Analyze the following tube network analytics data and provide structured recommendations.",
          context,
        }),
      });

      if (aiResponse.ok) {
        responsePayload = await aiResponse.json();
        summaryText = responsePayload.summary || "Analysis completed.";
      }
    }

    const analysisRun = await prisma.analysisRun.create({
      data: {
        periodFrom,
        periodTo,
        triggerType: "manual",
        requestPayload: context,
        responsePayload,
        summaryText,
      },
    });

    return NextResponse.json({
      id: analysisRun.id,
      summary: summaryText,
      response: responsePayload,
      createdAt: analysisRun.createdAt,
    });
  } catch (error) {
    console.error("Analysis run error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
