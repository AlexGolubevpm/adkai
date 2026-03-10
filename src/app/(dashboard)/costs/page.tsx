"use client";

import { useState } from "react";
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
import { formatCurrency } from "@/lib/utils";
import {
  RefreshCw,
  DollarSign,
  BarChart3,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CostsPage() {
  const [bundleFilter, setBundleFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("today");

  const filtered = COST_DATA.filter((e) =>
    bundleFilter === "all" ? true : e.bundle === bundleFilter
  );

  const totalCosts = filtered.reduce((sum, e) => sum + e.cost, 0);
  const uniqueSites = new Set(filtered.map((e) => e.site)).size;
  const avgCostPerSite = uniqueSites > 0 ? totalCosts / uniqueSites : 0;

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-zinc-100">Costs</h1>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Last synced: 2h ago
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* ---- Summary cards ---- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">{formatCurrency(totalCosts)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Avg Cost per Site</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">{formatCurrency(avgCostPerSite)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Unmatched Sites</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-400">{UNMATCHED_ENTRIES.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Filters ---- */}
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select value={bundleFilter} onChange={(e) => setBundleFilter(e.target.value)}>
            <SelectOption value="all">All Bundles</SelectOption>
            <SelectOption value="Gays">Gays</SelectOption>
            <SelectOption value="Trans">Trans</SelectOption>
            <SelectOption value="Hentai">Hentai</SelectOption>
            <SelectOption value="JAV">JAV</SelectOption>
          </Select>
        </div>

        <div className="w-48">
          <Select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
            <SelectOption value="today">Today</SelectOption>
            <SelectOption value="yesterday">Yesterday</SelectOption>
            <SelectOption value="7d">Last 7 days</SelectOption>
            <SelectOption value="30d">Last 30 days</SelectOption>
          </Select>
        </div>
      </div>

      {/* ---- Costs table ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site / Tube</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Cost ($)</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.site}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{entry.bundle}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{entry.date}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(entry.cost)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                      {entry.source}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-500">{entry.lastSync}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---- Unmatched entries ---- */}
      <Card className="border-yellow-400/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <CardTitle>Unmatched Entries</CardTitle>
          </div>
          <p className="text-sm text-zinc-400">
            Rows from Google Sheets that could not be mapped to any known site.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sheet Row</TableHead>
                <TableHead>Raw Site Name</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead className="text-right">Cost ($)</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {UNMATCHED_ENTRIES.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-zinc-500">#{entry.sheetRow}</TableCell>
                  <TableCell className="font-medium text-yellow-300">{entry.rawSiteName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.rawBundle}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(entry.cost)}
                  </TableCell>
                  <TableCell className="text-zinc-400">{entry.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
