"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  RefreshCw,
  DollarSign,
  BarChart3,
  AlertTriangle,
  FileSpreadsheet,
  TrendingDown,
} from "lucide-react";

interface CostEntry {
  id: number;
  site: string;
  bundle: string;
  date: string;
  cost: number;
  source: string;
  lastSync: string;
}

const COST_DATA: CostEntry[] = [
  { id: 1, site: "gaytube1.com", bundle: "Gays", date: "2026-03-09", cost: 124.50, source: "Google Sheets", lastSync: "2h ago" },
  { id: 2, site: "gaytube2.com", bundle: "Gays", date: "2026-03-09", cost: 89.20, source: "Google Sheets", lastSync: "2h ago" },
  { id: 3, site: "gayhub.net", bundle: "Gays", date: "2026-03-09", cost: 210.00, source: "Google Sheets", lastSync: "2h ago" },
  { id: 4, site: "transtube1.com", bundle: "Trans", date: "2026-03-09", cost: 76.30, source: "Google Sheets", lastSync: "2h ago" },
  { id: 5, site: "transvids.net", bundle: "Trans", date: "2026-03-09", cost: 145.80, source: "Google Sheets", lastSync: "2h ago" },
  { id: 6, site: "transworld.com", bundle: "Trans", date: "2026-03-09", cost: 53.40, source: "Google Sheets", lastSync: "2h ago" },
  { id: 7, site: "hentaistream.com", bundle: "Hentai", date: "2026-03-09", cost: 312.70, source: "Google Sheets", lastSync: "2h ago" },
  { id: 8, site: "hentaivault.net", bundle: "Hentai", date: "2026-03-09", cost: 198.40, source: "Google Sheets", lastSync: "2h ago" },
  { id: 9, site: "animexhub.com", bundle: "Hentai", date: "2026-03-09", cost: 87.60, source: "Google Sheets", lastSync: "2h ago" },
  { id: 10, site: "javflix.com", bundle: "JAV", date: "2026-03-09", cost: 267.90, source: "Google Sheets", lastSync: "2h ago" },
  { id: 11, site: "javprime.net", bundle: "JAV", date: "2026-03-09", cost: 183.20, source: "Google Sheets", lastSync: "2h ago" },
  { id: 12, site: "javworld.com", bundle: "JAV", date: "2026-03-08", cost: 154.10, source: "Google Sheets", lastSync: "2h ago" },
  { id: 13, site: "gaytube1.com", bundle: "Gays", date: "2026-03-08", cost: 131.00, source: "Google Sheets", lastSync: "2h ago" },
  { id: 14, site: "hentaistream.com", bundle: "Hentai", date: "2026-03-08", cost: 289.50, source: "Google Sheets", lastSync: "2h ago" },
  { id: 15, site: "transtube1.com", bundle: "Trans", date: "2026-03-08", cost: 68.90, source: "Google Sheets", lastSync: "2h ago" },
];

interface UnmatchedEntry {
  id: number;
  sheetRow: number;
  rawSiteName: string;
  rawBundle: string;
  cost: number;
  reason: string;
}

const UNMATCHED_ENTRIES: UnmatchedEntry[] = [
  { id: 1, sheetRow: 47, rawSiteName: "gaytube_old.com", rawBundle: "Gays", cost: 42.30, reason: "Site not found in database" },
  { id: 2, sheetRow: 63, rawSiteName: "hentai-archive", rawBundle: "Hentai", cost: 15.80, reason: "Invalid domain format" },
  { id: 3, sheetRow: 88, rawSiteName: "javstream.net", rawBundle: "JAV", cost: 91.00, reason: "Site was deleted / archived" },
];

const BUNDLE_COLORS: Record<string, string> = {
  Gays: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Trans: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Hentai: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  JAV: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function CostsPage() {
  const [bundleFilter, setBundleFilter] = useState("all");
  const [tab, setTab] = useState("entries");

  const filtered = COST_DATA.filter((e) =>
    bundleFilter === "all" ? true : e.bundle === bundleFilter
  );

  const totalCosts = filtered.reduce((sum, e) => sum + e.cost, 0);
  const uniqueSites = new Set(filtered.map((e) => e.site)).size;
  const avgCostPerSite = uniqueSites > 0 ? totalCosts / uniqueSites : 0;

  const kpis = [
    { label: "Total Costs", value: formatCurrency(totalCosts), icon: DollarSign, color: "#ef4444" },
    { label: "Avg per Site", value: formatCurrency(avgCostPerSite), icon: BarChart3, color: "#f59e0b" },
    { label: "Unmatched", value: String(UNMATCHED_ENTRIES.length), icon: AlertTriangle, color: "#eab308" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Costs</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            Last synced: 2h ago
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Costs
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3 stagger-children">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                  {kpi.label}
                </span>
                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40" style={{ backgroundColor: kpi.color }} />
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={bundleFilter}
          onChange={(e) => setBundleFilter(e.target.value)}
          className="w-40"
        >
          <SelectOption value="all">All Bundles</SelectOption>
          <SelectOption value="Gays">Gays</SelectOption>
          <SelectOption value="Trans">Trans</SelectOption>
          <SelectOption value="Hentai">Hentai</SelectOption>
          <SelectOption value="JAV">JAV</SelectOption>
        </Select>
        <Badge variant="secondary">
          {filtered.length} entries
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onChange={setTab}>
        <TabsList>
          <TabsTrigger value="entries">Cost Entries</TabsTrigger>
          <TabsTrigger value="unmatched">
            Unmatched ({UNMATCHED_ENTRIES.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-[var(--foreground)]">
                      {entry.site}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                          BUNDLE_COLORS[entry.bundle] ?? ""
                        }`}
                      >
                        {entry.bundle}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums text-[var(--foreground-muted)]">
                      {entry.date}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-red-400">
                      {formatCurrency(entry.cost)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs">{entry.source}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--foreground-subtle)]">
                      {entry.lastSync}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="unmatched">
          <Card className="border-yellow-500/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <CardTitle>Unmatched Entries</CardTitle>
              </div>
              <p className="text-xs text-[var(--foreground-muted)]">
                Rows from Google Sheets that could not be mapped to any known site.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Raw Site Name</TableHead>
                    <TableHead>Bundle</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {UNMATCHED_ENTRIES.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="tabular-nums text-[var(--foreground-subtle)]">
                        #{entry.sheetRow}
                      </TableCell>
                      <TableCell className="font-medium text-yellow-400">
                        {entry.rawSiteName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.rawBundle}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-red-400">
                        {formatCurrency(entry.cost)}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--foreground-muted)]">
                        {entry.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
