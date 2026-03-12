"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { NativeSelect as Select, SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  RefreshCw,
  DollarSign,
  BarChart3,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  X,
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Eye,
  Settings2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface CostEntry {
  id: string;
  siteName: string;
  bundleCode: string;
  bundleName: string;
  date: string;
  cost: number;
  source: string;
  sourceRowKey: string | null;
  syncedAt: string;
}

interface SheetConfig {
  id: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
  siteColumn: string;
  costColumn: string;
  dateColumn: string;
  usersColumn: string | null;
  headerRow: number;
  dataStartRow: number;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
}

interface SyncResult {
  configName: string;
  matched: number;
  unmatched: number;
  errors: number;
  unmatchedEntries: { row: number; site: string; cost: number; reason: string }[];
}

// ─── Constants ───────────────────────────────────────────────────

const BUNDLE_COLORS: Record<string, string> = {
  Gays: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Trans: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  Hentai: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  JAV: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

// ─── Component ───────────────────────────────────────────────────

export default function CostsPage() {
  const [tab, setTab] = useState("entries");
  const [bundleFilter, setBundleFilter] = useState("all");

  // Data state
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [configs, setConfigs] = useState<SheetConfig[]>([]);
  const [costsLoading, setCostsLoading] = useState(true);
  const [configsLoading, setConfigsLoading] = useState(true);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);

  // Add sheet modal
  const [showAddSheet, setShowAddSheet] = useState(false);

  // ─── Fetch data ───────────────────────────────────────────────

  const fetchCosts = useCallback(async () => {
    setCostsLoading(true);
    try {
      const res = await fetch("/api/costs");
      const json = await res.json();
      setCosts(json.costs ?? []);
    } catch {
      setCosts([]);
    } finally {
      setCostsLoading(false);
    }
  }, []);

  const fetchConfigs = useCallback(async () => {
    setConfigsLoading(true);
    try {
      const res = await fetch("/api/sheets");
      const json = await res.json();
      setConfigs(json.configs ?? []);
    } catch {
      setConfigs([]);
    } finally {
      setConfigsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCosts();
    fetchConfigs();
  }, [fetchCosts, fetchConfigs]);

  // ─── Sync handler ───────────────────────────────────────────

  const handleSync = async (configId?: string) => {
    setSyncing(true);
    setSyncResults(null);
    try {
      const res = await fetch("/api/costs/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configId ? { configId } : {}),
      });
      const json = await res.json();
      if (json.results) setSyncResults(json.results);
      await fetchCosts();
      await fetchConfigs();
    } catch {
      // Error handled silently
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      await fetch(`/api/sheets/${id}`, { method: "DELETE" });
      await fetchConfigs();
    } catch {
      // Error handled silently
    }
  };

  // ─── Computed values ──────────────────────────────────────────

  const filtered = costs.filter((e) =>
    bundleFilter === "all" ? true : e.bundleCode === bundleFilter
  );

  const totalCosts = filtered.reduce((sum, e) => sum + e.cost, 0);
  const uniqueSites = new Set(filtered.map((e) => e.siteName)).size;
  const avgCostPerSite = uniqueSites > 0 ? totalCosts / uniqueSites : 0;

  const lastSync = configs.reduce<string | null>((latest, c) => {
    if (!c.lastSyncAt) return latest;
    if (!latest) return c.lastSyncAt;
    return c.lastSyncAt > latest ? c.lastSyncAt : latest;
  }, null);

  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const kpis = [
    { label: "Total Costs", value: formatCurrency(totalCosts), icon: DollarSign, color: "#ef4444" },
    { label: "Avg per Site", value: formatCurrency(avgCostPerSite), icon: BarChart3, color: "#f59e0b" },
    { label: "Connected Sheets", value: String(configs.filter((c) => c.isActive).length), icon: FileSpreadsheet, color: "#22c55e" },
  ];

  // ─── Render ───────────────────────────────────────────────────

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
          <div className="mt-1 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            {lastSync ? (
              <>
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                Last synced: {formatRelativeTime(lastSync)}
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-gray-500" />
                No syncs yet
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowAddSheet(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Sheet
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleSync()}
            disabled={syncing || configs.length === 0}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync All"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {kpis.map((kpi) => {
          const bgMap: Record<string, string> = {
            "#ef4444": "var(--danger-light)",
            "#f59e0b": "var(--warning-light)",
            "#22c55e": "var(--success-light)",
          };
          return (
            <div key={kpi.label} className="kpi-card">
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div
                  className="kpi-icon"
                  style={{ background: bgMap[kpi.color] || "var(--surface-2)", color: kpi.color }}
                >
                  <kpi.icon style={{ width: 18, height: 18 }} />
                </div>
              </div>
              <div className="kpi-value">
                {costsLoading ? <Skeleton className="h-8 w-24" /> : kpi.value}
              </div>
              <div className="kpi-label">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Sync Results Banner */}
      <AnimatePresence>
        {syncResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600">Sync Complete</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSyncResults(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {syncResults.map((r) => (
                    <div key={r.configName} className="text-xs text-[var(--foreground-muted)]">
                      <span className="font-medium text-[var(--foreground)]">{r.configName}</span>
                      {" — "}
                      <span className="text-emerald-600">{r.matched} matched</span>
                      {r.unmatched > 0 && (
                        <span className="text-amber-600"> / {r.unmatched} unmatched</span>
                      )}
                      {r.errors > 0 && (
                        <span className="text-red-600"> / {r.errors} errors</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={tab} onChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="entries">Cost Entries</TabsTrigger>
            <TabsTrigger value="sheets">
              Google Sheets ({configs.length})
            </TabsTrigger>
            {syncResults?.some((r) => r.unmatched > 0) && (
              <TabsTrigger value="unmatched">
                Unmatched ({syncResults.reduce((s, r) => s + r.unmatched, 0)})
              </TabsTrigger>
            )}
          </TabsList>

          {tab === "entries" && (
            <div className="flex items-center gap-3">
              <Select
                value={bundleFilter}
                onChange={(e) => setBundleFilter(e.target.value)}
                className="w-40"
              >
                <SelectOption value="all">All Bundles</SelectOption>
                <SelectOption value="gays">Gays</SelectOption>
                <SelectOption value="trans">Trans</SelectOption>
                <SelectOption value="hentai">Hentai</SelectOption>
                <SelectOption value="jav">JAV</SelectOption>
              </Select>
              <Badge variant="secondary">{filtered.length} entries</Badge>
            </div>
          )}
        </div>

        {/* ─── Cost Entries Tab ─── */}
        <TabsContent value="entries">
          <Card>
            {costsLoading ? (
              <CardContent className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            ) : filtered.length === 0 ? (
              <CardContent className="p-12 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-[var(--foreground-subtle)] mb-3" />
                <p className="text-sm text-[var(--foreground-muted)]">
                  No cost entries yet. Connect a Google Sheet and sync to import costs.
                </p>
              </CardContent>
            ) : (
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
                        {entry.siteName}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                            BUNDLE_COLORS[entry.bundleName] ?? ""
                          }`}
                        >
                          {entry.bundleName}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums text-[var(--foreground-muted)]">
                        {entry.date}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-red-600">
                        {formatCurrency(entry.cost)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs">{entry.source}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[var(--foreground-subtle)]">
                        {entry.syncedAt ? formatRelativeTime(entry.syncedAt) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* ─── Google Sheets Tab ─── */}
        <TabsContent value="sheets">
          {configsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : configs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Link2 className="h-12 w-12 mx-auto text-[var(--foreground-subtle)] mb-3" />
                <p className="text-sm font-medium text-[var(--foreground)]">
                  No Google Sheets connected
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1 mb-4">
                  Connect a Google Sheet to start importing cost data automatically.
                </p>
                <Button size="sm" onClick={() => setShowAddSheet(true)} className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Connect Sheet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <Card key={config.id} className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                          <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">{config.name}</p>
                          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                            Sheet: {config.sheetName} | Columns: Site={config.siteColumn}, Cost={config.costColumn}, Date={config.dateColumn}
                            {config.usersColumn && `, Users=${config.usersColumn}`}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            {config.lastSyncAt ? (
                              <div className="flex items-center gap-1">
                                {config.lastSyncStatus === "success" ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-600" />
                                )}
                                <span className="text-[10px] text-[var(--foreground-subtle)]">
                                  {formatRelativeTime(config.lastSyncAt)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[var(--foreground-subtle)]">Never synced</span>
                            )}
                            {config.lastSyncError && (
                              <span className="text-[10px] text-red-600 truncate max-w-[200px]">
                                {config.lastSyncError}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSync(config.id)}
                          disabled={syncing}
                          className="gap-1.5"
                        >
                          <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                          Sync
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfig(config.id)}
                          className="text-red-600 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40"
                    style={{ backgroundColor: config.isActive ? "#22c55e" : "#6b7280" }}
                  />
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Unmatched Tab ─── */}
        {syncResults?.some((r) => r.unmatched > 0) && (
          <TabsContent value="unmatched">
            <Card className="border-yellow-500/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
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
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncResults.flatMap((r) =>
                      r.unmatchedEntries.map((entry) => (
                        <TableRow key={`${r.configName}-${entry.row}`}>
                          <TableCell className="tabular-nums text-[var(--foreground-subtle)]">
                            #{entry.row}
                          </TableCell>
                          <TableCell className="font-medium text-amber-600">
                            {entry.site}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-red-600">
                            {formatCurrency(entry.cost)}
                          </TableCell>
                          <TableCell className="text-xs text-[var(--foreground-muted)]">
                            {entry.reason}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ─── Add Sheet Modal ─── */}
      <Dialog open={showAddSheet} onOpenChange={setShowAddSheet}>
        <DialogContent>
          <AddSheetModalContent
            onClose={() => setShowAddSheet(false)}
            onCreated={() => {
              setShowAddSheet(false);
              fetchConfigs();
            }}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Add Sheet Modal Content ─────────────────────────────────────

function AddSheetModalContent({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<"url" | "configure" | "saving">("url");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [name, setName] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Column mapping
  const [siteColumn, setSiteColumn] = useState("A");
  const [costColumn, setCostColumn] = useState("B");
  const [dateColumn, setDateColumn] = useState("C");
  const [usersColumn, setUsersColumn] = useState("");
  const [dataStartRow, setDataStartRow] = useState(2);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /** Extract spreadsheet ID from URL or raw ID */
  const parseSpreadsheetId = (input: string): string | null => {
    // Full URL: https://docs.google.com/spreadsheets/d/{ID}/edit
    const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];

    // Raw ID
    if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) return input.trim();

    return null;
  };

  const handlePreview = async () => {
    const sid = parseSpreadsheetId(spreadsheetUrl);
    if (!sid) {
      setPreviewError("Invalid Google Sheets URL or ID");
      return;
    }

    setSpreadsheetId(sid);
    setPreviewLoading(true);
    setPreviewError("");

    try {
      const res = await fetch("/api/sheets/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId: sid, sheetName: sheetName || undefined }),
      });
      const json = await res.json();

      if (!res.ok) {
        setPreviewError(json.error || "Failed to access spreadsheet");
        return;
      }

      if (!name) setName(json.title || "Cost Sheet");
      setAvailableSheets(json.sheets || []);
      setSheetName(json.sheetName || "Sheet1");
      setPreview(json.preview || []);
      setStep("configure");
    } catch {
      setPreviewError("Failed to connect to Google Sheets");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          spreadsheetId,
          sheetName,
          siteColumn: siteColumn.toUpperCase(),
          costColumn: costColumn.toUpperCase(),
          dateColumn: dateColumn.toUpperCase(),
          usersColumn: usersColumn ? usersColumn.toUpperCase() : null,
          headerRow: 1,
          dataStartRow,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to save");
        return;
      }

      onCreated();
    } catch {
      setError("Failed to save sheet config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          </div>
          <DialogTitle>Connect Google Sheet</DialogTitle>
        </div>
        <DialogDescription>
          Connect a Google Sheet to import cost data automatically.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
            {step === "url" && (
              <>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
                    Spreadsheet URL or ID
                  </label>
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/... or spreadsheet ID"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  />
                  <p className="text-[10px] text-[var(--foreground-subtle)] mt-1.5">
                    Make sure the spreadsheet is shared with the service account email.
                  </p>
                </div>
                {previewError && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    {previewError}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePreview}
                    disabled={!spreadsheetUrl || previewLoading}
                    className="gap-2"
                  >
                    {previewLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    Preview
                  </Button>
                </div>
              </>
            )}

            {step === "configure" && (
              <>
                {/* Connection name */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
                    Connection Name
                  </label>
                  <Input
                    placeholder="e.g. Main Cost Sheet"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Sheet selector */}
                {availableSheets.length > 1 && (
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
                      Sheet
                    </label>
                    <Select value={sheetName} onChange={(e) => setSheetName(e.target.value)}>
                      {availableSheets.map((s) => (
                        <SelectOption key={s} value={s}>{s}</SelectOption>
                      ))}
                    </Select>
                  </div>
                )}

                {/* Column mapping */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground-muted)] mb-2 block">
                    <Settings2 className="h-3 w-3 inline mr-1" />
                    Column Mapping
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="text-[10px] text-[var(--foreground-subtle)] mb-1 block">Site Column</label>
                      <Input
                        value={siteColumn}
                        onChange={(e) => setSiteColumn(e.target.value)}
                        className="text-center"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--foreground-subtle)] mb-1 block">Cost Column</label>
                      <Input
                        value={costColumn}
                        onChange={(e) => setCostColumn(e.target.value)}
                        className="text-center"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--foreground-subtle)] mb-1 block">Date Column</label>
                      <Input
                        value={dateColumn}
                        onChange={(e) => setDateColumn(e.target.value)}
                        className="text-center"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--foreground-subtle)] mb-1 block">Users Column</label>
                      <Input
                        value={usersColumn}
                        onChange={(e) => setUsersColumn(e.target.value)}
                        placeholder="—"
                        className="text-center"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Data start row */}
                <div>
                  <label className="text-[10px] text-[var(--foreground-subtle)] mb-1 block">
                    Data starts at row
                  </label>
                  <Input
                    type="number"
                    min={2}
                    value={dataStartRow}
                    onChange={(e) => setDataStartRow(Number(e.target.value))}
                    className="w-20"
                  />
                </div>

                {/* Preview table */}
                {preview.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground-muted)] mb-2 block">
                      Data Preview
                    </label>
                    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--surface-1)]">
                            <th className="px-3 py-2 text-left text-[var(--foreground-subtle)]">#</th>
                            {preview[0]?.map((_, ci) => {
                              const colLetter = String.fromCharCode(65 + ci);
                              const isSite = colLetter === siteColumn.toUpperCase();
                              const isCost = colLetter === costColumn.toUpperCase();
                              const isDate = colLetter === dateColumn.toUpperCase();
                              const isUsers = colLetter === usersColumn?.toUpperCase();
                              return (
                                <th
                                  key={ci}
                                  className={`px-3 py-2 text-left ${
                                    isSite
                                      ? "text-blue-600"
                                      : isCost
                                      ? "text-red-600"
                                      : isDate
                                      ? "text-amber-600"
                                      : isUsers
                                      ? "text-emerald-600"
                                      : "text-[var(--foreground-subtle)]"
                                  }`}
                                >
                                  {colLetter}
                                  {isSite && " (Site)"}
                                  {isCost && " (Cost)"}
                                  {isDate && " (Date)"}
                                  {isUsers && " (Users)"}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, ri) => (
                            <tr key={ri} className="border-b border-[var(--border)] last:border-0">
                              <td className="px-3 py-1.5 text-[var(--foreground-subtle)]">{ri + 1}</td>
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-3 py-1.5 text-[var(--foreground-muted)]">
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    {error}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setStep("url")}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !name}
                      className="gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Connect & Save
                    </Button>
                  </div>
                </div>
              </>
            )}
      </div>
    </div>
  );
}
