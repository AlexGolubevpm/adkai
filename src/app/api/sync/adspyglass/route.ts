import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asg, parseWebsiteName, parseSpotName } from "@/lib/adspyglass";
import { calculateHealthScore, getHealthStatus } from "@/lib/health";
import {
  calculateProfit,
  calculateRomi,
  calculateRevenuePer1000,
} from "@/lib/metrics";

/**
 * POST /api/sync/adspyglass
 * Sync revenue data from AdSpyGlass for a given date (default: yesterday).
 * Body: { date?: "YYYY-MM-DD" }
 */
export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json().catch(() => ({ date: null }));

    const targetDate = date ? new Date(date) : new Date();
    if (!date) targetDate.setDate(targetDate.getDate() - 1);
    targetDate.setHours(0, 0, 0, 0);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Check for existing completed sync
    const existing = await prisma.syncRun.findFirst({
      where: {
        sourceType: "adspyglass",
        runStatus: "completed",
        payloadMeta: { path: ["date"], equals: dateStr },
      },
    });
    if (existing) {
      return NextResponse.json({ message: `Already synced for ${dateStr}`, syncRunId: existing.id });
    }

    const syncRun = await prisma.syncRun.create({
      data: {
        sourceType: "adspyglass",
        runType: "daily",
        runStatus: "running",
        payloadMeta: { date: dateStr },
      },
    });

    try {
      // 1. Fetch website-level report
      const websiteRows = await asg.getWebsiteReport(dateStr, dateStr);

      // 2. Fetch ad-type (format) level report
      const adTypeRows = await asg.getAdTypeReport(dateStr, dateStr);

      // 3. Auto-register or match sites
      const sites = await prisma.site.findMany({ include: { bundle: true } });
      const sitesByAsgId = new Map(sites.filter((s) => s.asgId).map((s) => [s.asgId!, s]));
      const sitesByDomain = new Map(sites.filter((s) => s.domain).map((s) => [s.domain!, s]));

      let sitesCreated = 0;
      let sitesUpdated = 0;

      for (const row of websiteRows) {
        const { externalId, domain } = row;
        let site = sitesByAsgId.get(externalId) || sitesByDomain.get(domain);

        if (!site) {
          // Auto-match by slug
          const slug = domain.replace(/^www\./, "");
          site = sites.find((s) => s.slug === slug);
        }

        if (!site) continue; // Unknown site — skip

        // Update ASG mapping if needed
        if (site.asgId !== externalId || site.domain !== domain) {
          await prisma.site.update({
            where: { id: site.id },
            data: { asgId: externalId, domain },
          });
          sitesUpdated++;
        }

        // Get costs for this site/date
        const costEntry = await prisma.costDaily.findUnique({
          where: { statDate_siteId: { statDate: targetDate, siteId: site.id } },
        });
        const costs = costEntry ? Number(costEntry.costValue) : 0;

        const revenue = row.broker_income;
        const traffic = row.hits;
        const profit = calculateProfit(revenue, costs);
        const romi = calculateRomi(revenue, costs);
        const revenuePer1000 = calculateRevenuePer1000(revenue, traffic);

        // Health score
        const prevDate = new Date(targetDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevStats = await prisma.dailyStat.findFirst({
          where: { siteId: site.id, statDate: prevDate },
        });

        const healthScore = calculateHealthScore({
          profit,
          romi,
          revenue,
          prevRevenue: prevStats ? Number(prevStats.revenue) : revenue,
          traffic,
          prevTraffic: prevStats ? prevStats.traffic : traffic,
          formatShares: [],
        });
        const healthStatus = getHealthStatus(healthScore);

        await prisma.dailyStat.upsert({
          where: { statDate_siteId: { statDate: targetDate, siteId: site.id } },
          create: {
            statDate: targetDate,
            siteId: site.id,
            bundleId: site.bundleId,
            hits: row.hits,
            clicks: row.clicks,
            impressions: row.impressions,
            brokerIncome: row.broker_income,
            predictedIncome: row.predicted_income,
            ctr: row.ctr,
            fillRate: row.fill_rate,
            realCpm: row.real_cpm,
            brokerCpm: row.broker_cpm,
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
            hits: row.hits,
            clicks: row.clicks,
            impressions: row.impressions,
            brokerIncome: row.broker_income,
            predictedIncome: row.predicted_income,
            ctr: row.ctr,
            fillRate: row.fill_rate,
            realCpm: row.real_cpm,
            brokerCpm: row.broker_cpm,
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
      }

      // 4. Sync per-site spot data
      for (const row of websiteRows) {
        const site = sitesByAsgId.get(row.externalId) || sitesByDomain.get(row.domain);
        if (!site) continue;

        const spotRows = await asg.getSpotReport(dateStr, dateStr, row.externalId);
        for (const sr of spotRows) {
          // Upsert AdSpot
          let spot = await prisma.adSpot.findUnique({ where: { asgId: sr.externalId } });
          if (!spot) {
            spot = await prisma.adSpot.create({
              data: {
                siteId: site.id,
                asgId: sr.externalId,
                name: sr.spotName,
                adType: "unknown",
              },
            });
          }

          await prisma.dailySpotStat.upsert({
            where: { statDate_spotId: { statDate: targetDate, spotId: spot.id } },
            create: {
              statDate: targetDate,
              spotId: spot.id,
              hits: sr.hits,
              clicks: sr.clicks,
              impressions: sr.impressions,
              brokerIncome: sr.broker_income,
              predictedIncome: sr.predicted_income,
              ctr: sr.ctr,
              fillRate: sr.fill_rate,
              realCpm: sr.real_cpm,
            },
            update: {
              hits: sr.hits,
              clicks: sr.clicks,
              impressions: sr.impressions,
              brokerIncome: sr.broker_income,
              predictedIncome: sr.predicted_income,
              ctr: sr.ctr,
              fillRate: sr.fill_rate,
              realCpm: sr.real_cpm,
            },
          });
        }
      }

      // 5. Store ad-type (format) breakdown per site
      for (const row of websiteRows) {
        const site = sitesByAsgId.get(row.externalId) || sitesByDomain.get(row.domain);
        if (!site) continue;

        // We only have global ad_type data, but can distribute by site ratio
        // For now store global ad_type data linked to a special "all" entry
        // Real per-site format data would need individual website_id + ad_type queries
      }

      // 6. Aggregate bundle stats
      const bundles = await prisma.bundle.findMany();
      for (const bundle of bundles) {
        const siteStats = await prisma.dailyStat.findMany({
          where: { bundleId: bundle.id, statDate: targetDate },
        });

        const hits = siteStats.reduce((s, st) => s + st.hits, 0);
        const clicks = siteStats.reduce((s, st) => s + st.clicks, 0);
        const impressions = siteStats.reduce((s, st) => s + st.impressions, 0);
        const brokerIncome = siteStats.reduce((s, st) => s + Number(st.brokerIncome), 0);
        const predictedIncome = siteStats.reduce((s, st) => s + Number(st.predictedIncome), 0);
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
          where: { statDate_bundleId: { statDate: targetDate, bundleId: bundle.id } },
          create: {
            statDate: targetDate,
            bundleId: bundle.id,
            hits, clicks, impressions,
            brokerIncome, predictedIncome,
            traffic, revenue, costs, profit, romi, revenuePer1000,
            healthScore: avgHealth,
          },
          update: {
            hits, clicks, impressions,
            brokerIncome, predictedIncome,
            traffic, revenue, costs, profit, romi, revenuePer1000,
            healthScore: avgHealth,
          },
        });
      }

      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          runStatus: "completed",
          finishedAt: new Date(),
          payloadMeta: {
            date: dateStr,
            websitesProcessed: websiteRows.length,
            sitesCreated,
            sitesUpdated,
          },
        },
      });

      return NextResponse.json({
        success: true,
        date: dateStr,
        websitesProcessed: websiteRows.length,
        sitesCreated,
        sitesUpdated,
      });
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
    console.error("AdSpyGlass sync error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
