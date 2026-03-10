"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  cn,
  formatNumber,
  formatCurrency,
  formatPercent,
  getHealthStatus,
  getHealthColor,
  getHealthBg,
  calculateRomi,
  calculateRevenuePer1000,
  calculateProfit,
} from "@/lib/utils";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  DollarSign,
  Users,
  BarChart3,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Bundle = "Gays" | "Trans" | "Hentai" | "JAV";
type Trend = "up" | "down" | "flat";

interface Site {
  id: string;
  name: string;
  bundle: Bundle;
  traffic: number;
  revenue: number;
  costs: number;
  healthScore: number;
  trend: Trend;
  status: "active" | "paused" | "review";
}

interface FormatBreakdown {
  name: string;
  revenue: number;
  share: number;
  traffic: number;
  rpm: number;
  trend: Trend;
}

// ---------------------------------------------------------------------------
// Mock data - same as list page so we can look up by id
// ---------------------------------------------------------------------------

const MOCK_SITES: Site[] = [
  // Gays (10)
  { id: "g1", name: "ManlyHub.com", bundle: "Gays", traffic: 482000, revenue: 18420, costs: 7200, healthScore: 92, trend: "up", status: "active" },
  { id: "g2", name: "RainbowTube.net", bundle: "Gays", traffic: 310000, revenue: 12350, costs: 5100, healthScore: 85, trend: "up", status: "active" },
  { id: "g3", name: "PrideVids.com", bundle: "Gays", traffic: 275000, revenue: 9870, costs: 4800, healthScore: 78, trend: "flat", status: "active" },
  { id: "g4", name: "QueerZone.net", bundle: "Gays", traffic: 198000, revenue: 7450, costs: 3900, healthScore: 71, trend: "down", status: "review" },
  { id: "g5", name: "OutProud.tv", bundle: "Gays", traffic: 165000, revenue: 6200, costs: 3200, healthScore: 68, trend: "flat", status: "active" },
  { id: "g6", name: "GayStream.live", bundle: "Gays", traffic: 142000, revenue: 5680, costs: 2900, healthScore: 82, trend: "up", status: "active" },
  { id: "g7", name: "BoysTown.xxx", bundle: "Gays", traffic: 128000, revenue: 4920, costs: 2700, healthScore: 63, trend: "down", status: "review" },
  { id: "g8", name: "HomoFlix.com", bundle: "Gays", traffic: 95000, revenue: 3610, costs: 2100, healthScore: 74, trend: "flat", status: "active" },
  { id: "g9", name: "DudeZone.net", bundle: "Gays", traffic: 72000, revenue: 2580, costs: 1800, healthScore: 55, trend: "down", status: "paused" },
  { id: "g10", name: "MenOnly.tv", bundle: "Gays", traffic: 54000, revenue: 1940, costs: 1400, healthScore: 48, trend: "down", status: "paused" },

  // Trans (10)
  { id: "t1", name: "TransHeaven.com", bundle: "Trans", traffic: 390000, revenue: 15600, costs: 6100, healthScore: 89, trend: "up", status: "active" },
  { id: "t2", name: "ShemaleHub.net", bundle: "Trans", traffic: 325000, revenue: 13000, costs: 5500, healthScore: 84, trend: "up", status: "active" },
  { id: "t3", name: "TSPlayground.com", bundle: "Trans", traffic: 260000, revenue: 10400, costs: 4700, healthScore: 81, trend: "up", status: "active" },
  { id: "t4", name: "TransCity.xxx", bundle: "Trans", traffic: 210000, revenue: 8400, costs: 4200, healthScore: 76, trend: "flat", status: "active" },
  { id: "t5", name: "TGirlTube.com", bundle: "Trans", traffic: 178000, revenue: 6670, costs: 3600, healthScore: 70, trend: "flat", status: "active" },
  { id: "t6", name: "TransVids.live", bundle: "Trans", traffic: 145000, revenue: 5510, costs: 3100, healthScore: 66, trend: "down", status: "review" },
  { id: "t7", name: "SheFlix.net", bundle: "Trans", traffic: 112000, revenue: 4250, costs: 2600, healthScore: 62, trend: "down", status: "review" },
  { id: "t8", name: "TSZone.tv", bundle: "Trans", traffic: 88000, revenue: 3170, costs: 2000, healthScore: 73, trend: "flat", status: "active" },
  { id: "t9", name: "TransStream.com", bundle: "Trans", traffic: 63000, revenue: 2200, costs: 1700, healthScore: 52, trend: "down", status: "paused" },
  { id: "t10", name: "LadyboyNet.com", bundle: "Trans", traffic: 41000, revenue: 1480, costs: 1300, healthScore: 42, trend: "down", status: "paused" },

  // Hentai (10)
  { id: "h1", name: "HentaiWorld.com", bundle: "Hentai", traffic: 520000, revenue: 20800, costs: 7800, healthScore: 94, trend: "up", status: "active" },
  { id: "h2", name: "AnimeXXX.net", bundle: "Hentai", traffic: 415000, revenue: 16600, costs: 6400, healthScore: 88, trend: "up", status: "active" },
  { id: "h3", name: "DoujinHub.com", bundle: "Hentai", traffic: 340000, revenue: 12920, costs: 5600, healthScore: 83, trend: "up", status: "active" },
  { id: "h4", name: "EcchiTube.net", bundle: "Hentai", traffic: 280000, revenue: 10640, costs: 4900, healthScore: 79, trend: "flat", status: "active" },
  { id: "h5", name: "HentaiStream.tv", bundle: "Hentai", traffic: 220000, revenue: 8140, costs: 4100, healthScore: 75, trend: "flat", status: "active" },
  { id: "h6", name: "MangaPorn.com", bundle: "Hentai", traffic: 175000, revenue: 6650, costs: 3500, healthScore: 69, trend: "down", status: "active" },
  { id: "h7", name: "Rule34Zone.xxx", bundle: "Hentai", traffic: 138000, revenue: 5240, costs: 3000, healthScore: 65, trend: "flat", status: "review" },
  { id: "h8", name: "AhegaoVids.com", bundle: "Hentai", traffic: 102000, revenue: 3870, costs: 2400, healthScore: 61, trend: "down", status: "review" },
  { id: "h9", name: "TentaFlix.net", bundle: "Hentai", traffic: 78000, revenue: 2810, costs: 1900, healthScore: 56, trend: "down", status: "paused" },
  { id: "h10", name: "NekoPorn.tv", bundle: "Hentai", traffic: 49000, revenue: 1760, costs: 1500, healthScore: 44, trend: "down", status: "paused" },

  // JAV (10)
  { id: "j1", name: "JAVLibrary.com", bundle: "JAV", traffic: 560000, revenue: 22400, costs: 8200, healthScore: 96, trend: "up", status: "active" },
  { id: "j2", name: "TokyoTube.net", bundle: "JAV", traffic: 440000, revenue: 17600, costs: 6800, healthScore: 90, trend: "up", status: "active" },
  { id: "j3", name: "JAVStream.com", bundle: "JAV", traffic: 360000, revenue: 14040, costs: 5900, healthScore: 86, trend: "up", status: "active" },
  { id: "j4", name: "NipponXXX.net", bundle: "JAV", traffic: 295000, revenue: 11210, costs: 5100, healthScore: 80, trend: "flat", status: "active" },
  { id: "j5", name: "AsianHub.tv", bundle: "JAV", traffic: 235000, revenue: 8930, costs: 4300, healthScore: 77, trend: "flat", status: "active" },
  { id: "j6", name: "JAVCity.xxx", bundle: "JAV", traffic: 185000, revenue: 7030, costs: 3700, healthScore: 72, trend: "down", status: "active" },
  { id: "j7", name: "OsakaVids.com", bundle: "JAV", traffic: 148000, revenue: 5620, costs: 3200, healthScore: 67, trend: "flat", status: "review" },
  { id: "j8", name: "SakuraFlix.net", bundle: "JAV", traffic: 110000, revenue: 4180, costs: 2500, healthScore: 64, trend: "down", status: "review" },
  { id: "j9", name: "JAVZone.live", bundle: "JAV", traffic: 82000, revenue: 2950, costs: 1900, healthScore: 58, trend: "down", status: "paused" },
  { id: "j10", name: "KyotoXXX.com", bundle: "JAV", traffic: 46000, revenue: 1660, costs: 1400, healthScore: 40, trend: "down", status: "paused" },
];

// ---------------------------------------------------------------------------
// Generate mock 7-day trend data based on site values
// ---------------------------------------------------------------------------

function generateTrendData(baseRevenue: number, baseTraffic: number, trend: Trend) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const multiplier = trend === "up" ? 1.04 : trend === "down" ? 0.96 : 1.0;

  return days.map((day, i) => {
    const factor = Math.pow(multiplier, i - 3);
    const jitter = 0.9 + Math.random() * 0.2;
    return {
      day,
      revenue: Math.round((baseRevenue / 7) * factor * jitter),
      traffic: Math.round((baseTraffic / 7) * factor * jitter),
    };
  });
}

// ---------------------------------------------------------------------------
// Generate mock format breakdown
// ---------------------------------------------------------------------------

function generateFormats(totalRevenue: number, totalTraffic: number): FormatBreakdown[] {
  const formats = [
    { name: "Popunder", sharePct: 0.35, trend: "up" as Trend },
    { name: "Native Banner", sharePct: 0.22, trend: "flat" as Trend },
    { name: "Push Notification", sharePct: 0.18, trend: "up" as Trend },
    { name: "Interstitial", sharePct: 0.12, trend: "down" as Trend },
    { name: "In-Page Push", sharePct: 0.08, trend: "flat" as Trend },
    { name: "Direct Link", sharePct: 0.05, trend: "down" as Trend },
  ];

  return formats.map((f) => {
    const rev = totalRevenue * f.sharePct;
    const traf = Math.round(totalTraffic * (f.sharePct + (Math.random() - 0.5) * 0.1));
    return {
      name: f.name,
      revenue: rev,
      share: f.sharePct * 100,
      traffic: traf,
      rpm: traf > 0 ? (rev / traf) * 1000 : 0,
      trend: f.trend,
    };
  });
}

// ---------------------------------------------------------------------------
// Health signals
// ---------------------------------------------------------------------------

function getPositiveSignals(site: Site): string[] {
  const signals: string[] = [];
  if (site.trend === "up") signals.push("Revenue trending upward");
  if (calculateRomi(site.revenue, site.costs) > 100) signals.push("ROMI above 100%");
  if (site.healthScore >= 80) signals.push("Health score in healthy range");
  if (site.status === "active") signals.push("Site is actively running");
  if (site.traffic > 200000) signals.push("Strong traffic volume");
  if (calculateRevenuePer1000(site.revenue, site.traffic) > 35) signals.push("High revenue per 1000 visitors");
  if (signals.length === 0) signals.push("No critical issues detected");
  return signals;
}

function getNegativeSignals(site: Site): string[] {
  const signals: string[] = [];
  if (site.trend === "down") signals.push("Revenue trending downward");
  if (calculateRomi(site.revenue, site.costs) < 50) signals.push("ROMI below 50%");
  if (site.healthScore < 60) signals.push("Health score in critical range");
  if (site.status === "paused") signals.push("Site is currently paused");
  if (site.traffic < 100000) signals.push("Low traffic volume");
  if (site.healthScore < 70 && site.healthScore >= 60) signals.push("Health score in warning range");
  if (signals.length === 0) signals.push("No negative signals");
  return signals;
}

// ---------------------------------------------------------------------------
// Trend icon helper
// ---------------------------------------------------------------------------

function trendIcon(trend: Trend) {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    default:
      return <Minus className="h-4 w-4 text-zinc-500" />;
  }
}

// ---------------------------------------------------------------------------
// Recharts custom tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-zinc-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name === "revenue" ? formatCurrency(p.value) : formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.id as string;

  const site = MOCK_SITES.find((s) => s.id === siteId) ?? MOCK_SITES[0];

  const profit = calculateProfit(site.revenue, site.costs);
  const romi = calculateRomi(site.revenue, site.costs);
  const revPer1000 = calculateRevenuePer1000(site.revenue, site.traffic);
  const healthStatus = getHealthStatus(site.healthScore);
  const healthColor = getHealthColor(healthStatus);
  const healthBg = getHealthBg(healthStatus);

  const trendData = useMemo(
    () => generateTrendData(site.revenue, site.traffic, site.trend),
    [site.revenue, site.traffic, site.trend]
  );

  const formats = useMemo(
    () => generateFormats(site.revenue, site.traffic),
    [site.revenue, site.traffic]
  );

  const positiveSignals = useMemo(() => getPositiveSignals(site), [site]);
  const negativeSignals = useMemo(() => getNegativeSignals(site), [site]);

  const overviewCards = [
    { label: "Traffic", value: formatNumber(site.traffic), icon: Users, color: "text-blue-400" },
    { label: "Revenue", value: formatCurrency(site.revenue), icon: DollarSign, color: "text-emerald-400" },
    { label: "Costs", value: formatCurrency(site.costs), icon: BarChart3, color: "text-red-400" },
    { label: "Profit", value: formatCurrency(profit), icon: DollarSign, color: profit >= 0 ? "text-emerald-400" : "text-red-400" },
    { label: "ROMI", value: formatPercent(romi), icon: Activity, color: romi >= 100 ? "text-emerald-400" : romi >= 50 ? "text-yellow-400" : "text-red-400" },
    { label: "Rev/1000", value: formatCurrency(revPer1000), icon: Globe, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <Link
          href="/sites"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-3xl font-bold text-zinc-100">{site.name}</h1>
          <Badge variant="secondary">{site.bundle}</Badge>
          {site.status === "active" && <Badge variant="healthy">Active</Badge>}
          {site.status === "paused" && <Badge variant="critical">Paused</Badge>}
          {site.status === "review" && <Badge variant="warning">Review</Badge>}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {overviewCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <card.icon className={cn("h-4 w-4", card.color)} />
                <span className="text-xs text-zinc-400">{card.label}</span>
              </div>
              <p className={cn("mt-2 text-2xl font-bold", card.color)}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#34d399" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traffic (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="traffic"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#60a5fa" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Format Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Format Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Format</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Share %</TableHead>
                <TableHead>Traffic</TableHead>
                <TableHead>RPM</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formats.map((f) => (
                <TableRow key={f.name}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-emerald-400">
                    {formatCurrency(f.revenue)}
                  </TableCell>
                  <TableCell>{formatPercent(f.share)}</TableCell>
                  <TableCell>{formatNumber(f.traffic)}</TableCell>
                  <TableCell>{formatCurrency(f.rpm)}</TableCell>
                  <TableCell>{trendIcon(f.trend)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Health Block */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Health Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Score */}
            <div className="flex flex-col items-center justify-center">
              <div
                className={cn(
                  "flex h-28 w-28 items-center justify-center rounded-full border-4",
                  healthBg
                )}
              >
                <span className={cn("text-4xl font-bold", healthColor)}>
                  {site.healthScore}
                </span>
              </div>
              <Badge
                variant={healthStatus as any}
                className="mt-3 capitalize"
              >
                {healthStatus}
              </Badge>
            </div>

            {/* Positive Signals */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Positive Signals
              </h4>
              <ul className="space-y-2">
                {positiveSignals.map((signal, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>

            {/* Negative Signals */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                <XCircle className="h-4 w-4" />
                Negative Signals
              </h4>
              <ul className="space-y-2">
                {negativeSignals.map((signal, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
