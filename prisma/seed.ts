import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BUNDLES = [
  { code: "gays", name: "Gays" },
  { code: "trans", name: "Trans" },
  { code: "hentai", name: "Hentai" },
  { code: "jav", name: "JAV" },
];

const SITES_PER_BUNDLE: Record<string, string[]> = {
  gays: [
    "GayTube1", "GayTube2", "GayTube3", "GayTube4", "GayTube5",
    "GayTube6", "GayTube7", "GayTube8", "GayTube9", "GayTube10",
  ],
  trans: [
    "TransTube1", "TransTube2", "TransTube3", "TransTube4", "TransTube5",
    "TransTube6", "TransTube7", "TransTube8", "TransTube9", "TransTube10",
  ],
  hentai: [
    "HentaiTube1", "HentaiTube2", "HentaiTube3", "HentaiTube4", "HentaiTube5",
    "HentaiTube6", "HentaiTube7", "HentaiTube8", "HentaiTube9", "HentaiTube10",
  ],
  jav: [
    "JavTube1", "JavTube2", "JavTube3", "JavTube4", "JavTube5",
    "JavTube6", "JavTube7", "JavTube8", "JavTube9", "JavTube10",
  ],
};

const FORMATS = ["pop", "push", "banner", "outstream", "slider", "vast"];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@adkai.com" },
    update: {},
    create: {
      email: "admin@adkai.com",
      password: passwordHash,
      name: "Admin",
      role: "admin",
    },
  });
  console.log("Admin user created: admin@adkai.com / admin123");

  // Create bundles
  for (const b of BUNDLES) {
    await prisma.bundle.upsert({
      where: { code: b.code },
      update: { name: b.name },
      create: { code: b.code, name: b.name },
    });
  }
  console.log("Bundles created");

  // Create sites
  const bundles = await prisma.bundle.findMany();
  for (const bundle of bundles) {
    const siteNames = SITES_PER_BUNDLE[bundle.code] || [];
    for (const name of siteNames) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      await prisma.site.upsert({
        where: { slug },
        update: { name, bundleId: bundle.id },
        create: {
          name,
          slug,
          externalKey: slug,
          bundleId: bundle.id,
          isActive: true,
        },
      });
    }
  }
  console.log("Sites created");

  // Generate mock daily stats for last 7 days
  const sites = await prisma.site.findMany({ include: { bundle: true } });

  for (let dayOffset = 7; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    for (const site of sites) {
      const traffic = Math.round(rand(5000, 50000));
      const revenue = Number(rand(50, 500).toFixed(4));
      const costs = Number(rand(20, 200).toFixed(4));
      const profit = Number((revenue - costs).toFixed(4));
      const romi = costs > 0 ? Number((((revenue - costs) / costs) * 100).toFixed(2)) : 0;
      const revenuePer1000 = traffic > 0 ? Number(((revenue / traffic) * 1000).toFixed(4)) : 0;
      const healthScore = Math.round(rand(30, 98));
      const healthStatus = healthScore >= 80 ? "healthy" : healthScore >= 60 ? "warning" : "critical";

      await prisma.dailyStat.upsert({
        where: { statDate_siteId: { statDate: date, siteId: site.id } },
        update: { traffic, revenue, costs, profit, romi, revenuePer1000, healthScore, healthStatus },
        create: {
          statDate: date,
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
      });

      // Format stats
      let remainingShare = 100;
      for (let fi = 0; fi < FORMATS.length; fi++) {
        const isLast = fi === FORMATS.length - 1;
        const share = isLast ? remainingShare : Math.round(rand(5, Math.min(40, remainingShare - (FORMATS.length - fi - 1) * 5)));
        remainingShare -= share;

        const fmtRevenue = Number((revenue * share / 100).toFixed(4));
        const fmtTraffic = Math.round(traffic * share / 100);
        const fmtRpm = fmtTraffic > 0 ? Number(((fmtRevenue / fmtTraffic) * 1000).toFixed(4)) : 0;

        await prisma.dailyFormatStat.upsert({
          where: {
            statDate_siteId_formatName: { statDate: date, siteId: site.id, formatName: FORMATS[fi] },
          },
          update: { traffic: fmtTraffic, revenue: fmtRevenue, revenuePer1000: fmtRpm, sharePercent: share },
          create: {
            statDate: date,
            siteId: site.id,
            bundleId: site.bundleId,
            formatName: FORMATS[fi],
            traffic: fmtTraffic,
            revenue: fmtRevenue,
            revenuePer1000: fmtRpm,
            sharePercent: share,
          },
        });
      }
    }

    // Bundle aggregates
    for (const bundle of bundles) {
      const bundleSites = sites.filter((s) => s.bundleId === bundle.id);
      const bundleStats = await prisma.dailyStat.findMany({
        where: { bundleId: bundle.id, statDate: date },
      });

      const traffic = bundleStats.reduce((s, st) => s + st.traffic, 0);
      const revenue = bundleStats.reduce((s, st) => s + Number(st.revenue), 0);
      const costs = bundleStats.reduce((s, st) => s + Number(st.costs), 0);
      const profit = revenue - costs;
      const romi = costs > 0 ? ((revenue - costs) / costs) * 100 : 0;
      const revenuePer1000 = traffic > 0 ? (revenue / traffic) * 1000 : 0;
      const avgHealth = bundleStats.length > 0
        ? Math.round(bundleStats.reduce((s, st) => s + st.healthScore, 0) / bundleStats.length)
        : 0;

      await prisma.dailyBundleStat.upsert({
        where: { statDate_bundleId: { statDate: date, bundleId: bundle.id } },
        update: { traffic, revenue, costs, profit, romi, revenuePer1000, healthScore: avgHealth },
        create: {
          statDate: date,
          bundleId: bundle.id,
          traffic,
          revenue: Number(revenue.toFixed(4)),
          costs: Number(costs.toFixed(4)),
          profit: Number(profit.toFixed(4)),
          romi: Number(romi.toFixed(2)),
          revenuePer1000: Number(revenuePer1000.toFixed(4)),
          healthScore: avgHealth,
        },
      });
    }

    console.log(`Stats generated for ${date.toISOString().split("T")[0]}`);
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
