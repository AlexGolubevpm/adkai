import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateHealthScore, getHealthStatus } from "@/lib/health";
import {
  calculateProfit,
  calculateRomi,
  calculateRevenuePer1000,
} from "@/lib/metrics";

export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json().catch(() => ({ date: null }));

    const targetDate = date ? new Date(date) : new Date();
    if (!date) {
      targetDate.setDate(targetDate.getDate() - 1);
    }
    targetDate.setHours(0, 0, 0, 0);

    const dateStr = targetDate.toISOString().split("T")[0];

    // Check for duplicate
    const existing = await prisma.syncRun.findFirst({
      where: {
        sourceType: "adok",
        runStatus: "completed",
        payloadMeta: { path: ["date"], equals: dateStr },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already synced for " + dateStr });
    }

    // Create sync run
    const syncRun = await prisma.syncRun.create({
      data: {
        sourceType: "adok",
        runType: "daily",
        runStatus: "running",
        payloadMeta: { date: dateStr },
      },
    });

    try {
      // Fetch from AdOK API
      const apiUrl = process.env.ADOK_API_URL;
      const apiKey = process.env.ADOK_API_KEY;

      if (!apiUrl || !apiKey) {
        throw new Error("AdOK API credentials not configured");
      }

      const response = await fetch(`${apiUrl}/stats?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        throw new Error(`AdOK API returned ${response.status}`);
      }

      const data = await response.json();

      // Process and store data
      const sites = await prisma.site.findMany({
        include: { bundle: true },
      });

      for (const site of sites) {
        const siteData = data.sites?.find(
          (s: { key: string }) => s.key === site.externalKey
        );
        if (!siteData) continue;

        const traffic = siteData.traffic || 0;
        const revenue = siteData.revenue || 0;
        const costs = siteData.costs || 0;
        const profit = calculateProfit(revenue, costs);
        const romi = calculateRomi(revenue, costs);
        const revenuePer1000 = calculateRevenuePer1000(revenue, traffic);

        // Get previous day stats for health calculation
        const prevDate = new Date(targetDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevStats = await prisma.dailyStat.findFirst({
          where: { siteId: site.id, statDate: prevDate },
        });

        const formatShares = (siteData.formats || []).map(
          (f: { share: number }) => f.share || 0
        );
        const healthScore = calculateHealthScore({
          profit,
          romi,
          revenue,
          prevRevenue: prevStats ? Number(prevStats.revenue) : revenue,
          traffic,
          prevTraffic: prevStats ? prevStats.traffic : traffic,
          formatShares,
        });
        const healthStatus = getHealthStatus(healthScore);

        await prisma.dailyStat.upsert({
          where: { statDate_siteId: { statDate: targetDate, siteId: site.id } },
          create: {
            statDate: targetDate,
            siteId: site.id,
            bundleId: site.bundleId,
            traffic,
            revenue,
            costs,
            profit,
            romi,
            revenuePer1000,
            healthScore,
            healthStatus,
          },
          update: {
            traffic,
            revenue,
            costs,
            profit,
            romi,
            revenuePer1000,
            healthScore,
            healthStatus,
          },
        });

        // Store format stats
        for (const fmt of siteData.formats || []) {
          await prisma.dailyFormatStat.upsert({
            where: {
              statDate_siteId_formatName: {
                statDate: targetDate,
                siteId: site.id,
                formatName: fmt.name,
              },
            },
            create: {
              statDate: targetDate,
              siteId: site.id,
              bundleId: site.bundleId,
              formatName: fmt.name,
              traffic: fmt.traffic || 0,
              revenue: fmt.revenue || 0,
              revenuePer1000: calculateRevenuePer1000(fmt.revenue || 0, fmt.traffic || 0),
              sharePercent: fmt.share || 0,
            },
            update: {
              traffic: fmt.traffic || 0,
              revenue: fmt.revenue || 0,
              revenuePer1000: calculateRevenuePer1000(fmt.revenue || 0, fmt.traffic || 0),
              sharePercent: fmt.share || 0,
            },
          });
        }
      }

      // Aggregate bundle stats
      const bundles = await prisma.bundle.findMany();
      for (const bundle of bundles) {
        const siteStats = await prisma.dailyStat.findMany({
          where: { bundleId: bundle.id, statDate: targetDate },
        });

        const traffic = siteStats.reduce((s, st) => s + st.traffic, 0);
        const revenue = siteStats.reduce((s, st) => s + Number(st.revenue), 0);
        const costs = siteStats.reduce((s, st) => s + Number(st.costs), 0);
        const profit = calculateProfit(revenue, costs);
        const romi = calculateRomi(revenue, costs);
        const revenuePer1000 = calculateRevenuePer1000(revenue, traffic);
        const avgHealth = siteStats.length > 0
          ? Math.round(siteStats.reduce((s, st) => s + st.healthScore, 0) / siteStats.length)
          : 0;

        await prisma.dailyBundleStat.upsert({
          where: {
            statDate_bundleId: { statDate: targetDate, bundleId: bundle.id },
          },
          create: {
            statDate: targetDate,
            bundleId: bundle.id,
            traffic,
            revenue,
            costs,
            profit,
            romi,
            revenuePer1000,
            healthScore: avgHealth,
          },
          update: { traffic, revenue, costs, profit, romi, revenuePer1000, healthScore: avgHealth },
        });
      }

      // Mark sync as completed
      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: { runStatus: "completed", finishedAt: new Date() },
      });

      return NextResponse.json({ success: true, date: dateStr });
    } catch (syncError) {
      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          runStatus: "failed",
          finishedAt: new Date(),
          errorText: String(syncError),
        },
      });
      throw syncError;
    }
  } catch (error) {
    console.error("AdOK sync error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
