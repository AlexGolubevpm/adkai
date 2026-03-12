"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Brain,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FileText,
} from "lucide-react";
import { useApi } from "@/lib/hooks";

interface AnalysisRun {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  prompt?: string;
  result?: string;
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" as const, color: "text-[var(--foreground-muted)]" },
  running: { label: "Running", icon: Loader2, variant: "primary" as const, color: "text-indigo-600" },
  completed: { label: "Completed", icon: CheckCircle2, variant: "healthy" as const, color: "text-emerald-600" },
  failed: { label: "Failed", icon: AlertCircle, variant: "critical" as const, color: "text-red-600" },
};

export default function AnalysisPage() {
  const [tab, setTab] = useState("run");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const { data: history } = useApi<AnalysisRun[]>("/api/analysis/history");

  async function handleRunAnalysis() {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/analysis/run", { method: "POST" });
      const data = await res.json();
      setResult(data.result ?? data.error ?? "Analysis completed.");
    } catch {
      setResult("Failed to run analysis. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-7"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-muted)]">AI-powered insights for your ad network</p>
        <Button onClick={handleRunAnalysis} disabled={isRunning} className="gap-2">
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>

      <Tabs value={tab} onChange={setTab}>
        <TabsList>
          <TabsTrigger value="run">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Run
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="run">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-sm">AI Analysis Engine</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[var(--foreground-muted)] mb-4">
                Analyze your data using AI to find patterns, anomalies, and optimization opportunities.
              </p>

              {isRunning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-2 border-indigo-500/20 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" style={{ animationDuration: "2s" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--foreground)]">Running analysis...</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">This may take a few moments</p>
                  </div>
                </motion.div>
              )}

              {!isRunning && !result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-4 text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Ready to analyze</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1 max-w-sm">
                      Click &quot;Run Analysis&quot; to generate AI-powered insights about your ad network performance, trends, and optimization opportunities.
                    </p>
                  </div>
                </motion.div>
              )}

              {!isRunning && result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600">Analysis complete</span>
                  </div>
                  <Card className="bg-[var(--surface-1)]">
                    <CardContent className="p-4">
                      <pre className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap font-sans leading-relaxed">
                        {result}
                      </pre>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {history && history.length > 0 ? (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((run) => {
                    const cfg = statusConfig[run.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <TableRow key={run.id}>
                        <TableCell>
                          <Badge variant={cfg.variant} className="gap-1">
                            <StatusIcon className={`h-3 w-3 ${run.status === "running" ? "animate-spin" : ""}`} />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-[var(--foreground-muted)]">
                          {new Date(run.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-[var(--foreground-muted)]">
                          {run.completedAt ? new Date(run.completedAt).toLocaleString() : "\u2014"}
                        </TableCell>
                        <TableCell className="text-xs text-[var(--foreground-subtle)] max-w-[300px] truncate">
                          {run.result?.slice(0, 80) ?? "\u2014"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="py-16 text-center">
              <FileText className="h-10 w-10 mx-auto opacity-30 mb-3 text-[var(--foreground-subtle)]" />
              <p className="text-sm text-[var(--foreground-subtle)]">No analysis history yet</p>
              <p className="text-xs text-[var(--foreground-disabled)] mt-1">Run your first analysis to see results here</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
