"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { Select, SelectOption } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  cn,
  formatNumber,
  formatCurrency,
  formatPercent,
  getHealthStatus,
  getHealthColor,
  calculateRomi,
  calculateRevenuePer1000,
  calculateProfit,
} from "@/lib/utils";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

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

// ---------------------------------------------------------------------------
// Mock data – 40 sites, 10 per bundle
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
// Helpers
// ---------------------------------------------------------------------------

type SortKey =
  | "name"
  | "bundle"
  | "traffic"
  | "revenue"
  | "costs"
  | "profit"
  | "romi"
  | "revPer1000"
  | "healthScore"
  | "status"
  | "trend";

type SortDir = "asc" | "desc";

const BUNDLES = ["All", "Gays", "Trans", "Hentai", "JAV"] as const;
const PERIODS = ["Today", "7 Days", "30 Days", "90 Days"] as const;

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

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="healthy">Active</Badge>;
    case "paused":
      return <Badge variant="critical">Paused</Badge>;
    case "review":
      return <Badge variant="warning">Review</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SitesPage() {
  const [bundleFilter, setBundleFilter] = useState<string>("All");
  const [periodFilter, setPeriodFilter] = useState<string>("7 Days");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-zinc-600" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3 text-zinc-300" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3 text-zinc-300" />
    );
  };

  const filtered = useMemo(() => {
    let list = MOCK_SITES;
    if (bundleFilter !== "All") {
      list = list.filter((s) => s.bundle === bundleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [bundleFilter, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;

    copy.sort((a, b) => {
      const profitA = calculateProfit(a.revenue, a.costs);
      const profitB = calculateProfit(b.revenue, b.costs);
      const romiA = calculateRomi(a.revenue, a.costs);
      const romiB = calculateRomi(b.revenue, b.costs);
      const rp1A = calculateRevenuePer1000(a.revenue, a.traffic);
      const rp1B = calculateRevenuePer1000(b.revenue, b.traffic);

      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "bundle":
          return dir * a.bundle.localeCompare(b.bundle);
        case "traffic":
          return dir * (a.traffic - b.traffic);
        case "revenue":
          return dir * (a.revenue - b.revenue);
        case "costs":
          return dir * (a.costs - b.costs);
        case "profit":
          return dir * (profitA - profitB);
        case "romi":
          return dir * (romiA - romiB);
        case "revPer1000":
          return dir * (rp1A - rp1B);
        case "healthScore":
          return dir * (a.healthScore - b.healthScore);
        case "status":
          return dir * a.status.localeCompare(b.status);
        case "trend": {
          const order = { up: 3, flat: 2, down: 1 };
          return dir * (order[a.trend] - order[b.trend]);
        }
        default:
          return 0;
      }
    });

    return copy;
  }, [filtered, sortKey, sortDir]);

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Site Name" },
    { key: "bundle", label: "Bundle" },
    { key: "traffic", label: "Traffic" },
    { key: "revenue", label: "Revenue" },
    { key: "costs", label: "Costs" },
    { key: "profit", label: "Profit" },
    { key: "romi", label: "ROMI" },
    { key: "revPer1000", label: "Rev/1000" },
    { key: "healthScore", label: "Health" },
    { key: "status", label: "Status" },
    { key: "trend", label: "Trend" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Sites</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage and monitor all sites across bundles
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Bundle</label>
            <Select
              className="w-36"
              value={bundleFilter}
              onChange={(e) => setBundleFilter(e.target.value)}
            >
              {BUNDLES.map((b) => (
                <SelectOption key={b} value={b}>
                  {b}
                </SelectOption>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Period</label>
            <Select
              className="w-32"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              {PERIODS.map((p) => (
                <SelectOption key={p} value={p}>
                  {p}
                </SelectOption>
              ))}
            </Select>
          </div>

          <div className="relative ml-auto w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              className="pl-9"
              placeholder="Search sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <p className="text-sm text-zinc-500">
        Showing {sorted.length} of {MOCK_SITES.length} sites
      </p>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortIcon(col.key)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((site) => {
              const profit = calculateProfit(site.revenue, site.costs);
              const romi = calculateRomi(site.revenue, site.costs);
              const revPer1000 = calculateRevenuePer1000(
                site.revenue,
                site.traffic
              );
              const healthStatus = getHealthStatus(site.healthScore);
              const healthColor = getHealthColor(healthStatus);

              return (
                <TableRow key={site.id} className="group">
                  <TableCell>
                    <Link
                      href={`/sites/${site.id}`}
                      className="font-medium text-zinc-100 underline-offset-4 group-hover:underline"
                    >
                      {site.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{site.bundle}</Badge>
                  </TableCell>
                  <TableCell>{formatNumber(site.traffic)}</TableCell>
                  <TableCell className="text-emerald-400">
                    {formatCurrency(site.revenue)}
                  </TableCell>
                  <TableCell className="text-red-400">
                    {formatCurrency(site.costs)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      profit >= 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {formatCurrency(profit)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        romi >= 100
                          ? "text-emerald-400"
                          : romi >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                      )}
                    >
                      {formatPercent(romi)}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(revPer1000)}</TableCell>
                  <TableCell>
                    <span className={cn("font-semibold", healthColor)}>
                      {site.healthScore}
                    </span>
                  </TableCell>
                  <TableCell>{statusBadge(site.status)}</TableCell>
                  <TableCell>{trendIcon(site.trend)}</TableCell>
                </TableRow>
              );
            })}

            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-zinc-500"
                >
                  No sites found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
