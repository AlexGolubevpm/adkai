import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readCostData } from "@/lib/google-sheets";
import {
  calculateProfit,
  calculateRomi,
  calculateRevenuePer1000,
} from "@/lib/metrics";
import { calculateHealthScore, getHealthStatus } from "@/lib/health";

/**
 * POST /api/costs/sync
 * Sync costs from a Google Sheet config.
 * Body: { configId?: string } — if omitted, syncs all active configs.
 */
export async function POST(req: NextRequest) {
  try {
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!serviceEmail || !privateKey) {
      return NextResponse.json(
        { error: "Google Sheets credentials not configured (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const configId = body.configId as string | undefined;

    // Find configs to sync
    const configs = configId
      ? await prisma.googleSheetConfig.findMany({ where: { id: configId } })
      : await prisma.googleSheetConfig.findMany({ where: { isActive: true } });

    if (configs.length === 0) {
      return NextResponse.json(
        { error: "No sheet configs found. Add a Google Sheet connection first." },
        { status: 400 }
      );
    }

    // Load all sites for matching
    const sites = await prisma.site.findMany({ include: { bundle: true } });
    const siteByName = new Map(sites.map((s) => [s.name.toLowerCase(), s]));
    const siteBySlug = new Map(sites.map((s) => [s.slug.toLowerCase(), s]));
    const siteByDomain = new Map(
      sites.filter((s) => s.domain).map((s) => [s.domain!.toLowerCase(), s])
    );

    const results: {
      configName: string;
      matched: number;
      unmatched: number;
      errors: number;
      unmatchedEntries: { row: number; site: string; cost: number; reason: string }[];
    }[] = [];

    for (const config of configs) {
      const syncRun = await prisma.syncRun.create({
        data: {
          sourceType: "google_sheets",
          runType: "manual",
          runStatus: "running",
          payloadMeta: { configId: config.id, configName: config.name },
        },
      });

      try {
        const { rows, errors: parseErrors } = await readCostData({
          spreadsheetId: config.spreadsheetId,
          sheetName: config.sheetName,
          siteColumn: config.siteColumn,
          costColumn: config.costColumn,
          dateColumn: config.dateColumn,
          usersColumn: config.usersColumn,
          dataStartRow: config.dataStartRow,
        });

        let matched = 0;
        const unmatchedEntries: { row: number; site: string; cost: number; reason: string }[] = [];

        for (const row of rows) {
          // Try to match site by name, slug, or domain
          const key = row.site.toLowerCase().trim();
          const site =
            siteByName.get(key) ||
            siteBySlug.get(key) ||
            siteByDomain.get(key) ||
            // Try partial match — strip www., .com etc.
            siteBySlug.get(key.replace(/^www\./, "").replace(/\.\w+$/, "")) ||
            siteByDomain.get(key.replace(/^www\./, ""));

          if (!site) {
            unmatchedEntries.push({
              row: row.rowIndex,
              site: row.site,
              cost: row.cost,
              reason: "Site not found in database",
            });
            continue;
          }

          const statDate = new Date(row.date + "T00:00:00.000Z");

          // Upsert cost entry
          await prisma.costDaily.upsert({
            where: {
              statDate_siteId: { statDate, siteId: site.id },
            },
            create: {
              statDate,
              siteId: site.id,
              bundleId: site.bundleId,
              costValue: row.cost,
              sourceType: "google_sheets",
              sourceRowKey: `${config.spreadsheetId}:${config.sheetName}:${row.rowIndex}`,
            },
            update: {
              costValue: row.cost,
              sourceType: "google_sheets",
              sourceRowKey: `${config.spreadsheetId}:${config.sheetName}:${row.rowIndex}`,
              syncedAt: new Date(),
            },
          });

          // Update DailyStat if it exists (recalculate profit/romi)
          const existingStat = await prisma.dailyStat.findUnique({
            where: { statDate_siteId: { statDate, siteId: site.id } },
          });

          if (existingStat) {
            const revenue = Number(existingStat.revenue);
            const costs = row.cost;
            const traffic = existingStat.traffic;
            const profit = calculateProfit(revenue, costs);
            const romi = calculateRomi(revenue, costs);
            const revenuePer1000 = calculateRevenuePer1000(revenue, traffic);

            // Recalculate health score
            const prevDate = new Date(statDate);
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

            await prisma.dailyStat.update({
              where: { id: existingStat.id },
              data: { costs, profit, romi, revenuePer1000, healthScore, healthStatus },
            });
          }

          matched++;
        }

        // Recalculate bundle stats for affected dates
        const affectedDates = [...new Set(rows.map((r) => r.date))];
        for (const dateStr of affectedDates) {
          const targetDate = new Date(dateStr + "T00:00:00.000Z");
          const bundles = await prisma.bundle.findMany();

          for (const bundle of bundles) {
            const siteStats = await prisma.dailyStat.findMany({
              where: { bundleId: bundle.id, statDate: targetDate },
            });
            if (siteStats.length === 0) continue;

            const traffic = siteStats.reduce((s, st) => s + st.traffic, 0);
            const revenue = siteStats.reduce((s, st) => s + Number(st.revenue), 0);
            const costs = siteStats.reduce((s, st) => s + Number(st.costs), 0);
            const profit = calculateProfit(revenue, costs);
            const romi = calculateRomi(revenue, costs);
            const revenuePer1000 = calculateRevenuePer1000(revenue, traffic);
            const avgHealth = Math.round(
              siteStats.reduce((s, st) => s + st.healthScore, 0) / siteStats.length
            );

            await prisma.dailyBundleStat.upsert({
              where: { statDate_bundleId: { statDate: targetDate, bundleId: bundle.id } },
              create: {
                statDate: targetDate,
                bundleId: bundle.id,
                hits: siteStats.reduce((s, st) => s + st.hits, 0),
                clicks: siteStats.reduce((s, st) => s + st.clicks, 0),
                impressions: siteStats.reduce((s, st) => s + st.impressions, 0),
                brokerIncome: siteStats.reduce((s, st) => s + Number(st.brokerIncome), 0),
                predictedIncome: siteStats.reduce((s, st) => s + Number(st.predictedIncome), 0),
                traffic, revenue, costs, profit, romi, revenuePer1000,
                healthScore: avgHealth,
              },
              update: {
                costs, profit, romi, revenuePer1000,
                healthScore: avgHealth,
              },
            });
          }
        }

        // Update config status
        await prisma.googleSheetConfig.update({
          where: { id: config.id },
          data: {
            lastSyncAt: new Date(),
            lastSyncStatus: "success",
            lastSyncError: null,
          },
        });

        await prisma.syncRun.update({
          where: { id: syncRun.id },
          data: {
            runStatus: "completed",
            finishedAt: new Date(),
            payloadMeta: {
              configId: config.id,
              matched,
              unmatched: unmatchedEntries.length,
              parseErrors: parseErrors.length,
              affectedDates,
            },
          },
        });

        results.push({
          configName: config.name,
          matched,
          unmatched: unmatchedEntries.length,
          errors: parseErrors.length,
          unmatchedEntries,
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

        await prisma.googleSheetConfig.update({
          where: { id: config.id },
          data: {
            lastSyncAt: new Date(),
            lastSyncStatus: "error",
            lastSyncError: String(syncError),
          },
        });

        results.push({
          configName: config.name,
          matched: 0,
          unmatched: 0,
          errors: 1,
          unmatchedEntries: [],
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Costs synced from Google Sheets",
      results,
    });
  } catch (error) {
    console.error("Costs sync error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
