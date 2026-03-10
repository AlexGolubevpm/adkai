"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Layers,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConclusionCard {
  id: number;
  category: string;
  entity: string;
  bundle?: string;
  metricName: string;
  metricValue: string;
  delta: number;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const DATES = [
  { label: "March 9, 2026", value: "2026-03-09" },
  { label: "March 8, 2026", value: "2026-03-08" },
  { label: "March 7, 2026", value: "2026-03-07" },
  { label: "March 6, 2026", value: "2026-03-06" },
];

const WORST_SITES: ConclusionCard[] = [
  {
    id: 1,
    category: "Health Score",
    entity: "transvids.net",
    bundle: "Trans",
    metricName: "Lowest Health",
    metricValue: "32",
    delta: -18.5,
    explanation:
      "Traffic dropped 34% with zero pop revenue. All format eCPMs below threshold.",
  },
  {
    id: 2,
    category: "ROMI",
    entity: "hentaivault.net",
    bundle: "Hentai",
    metricName: "Lowest ROMI",
    metricValue: "-42%",
    delta: -27.3,
    explanation:
      "Costs surged to $198 while revenue fell to $115. Banner and slider formats underperforming.",
  },
  {
    id: 3,
    category: "Revenue",
    entity: "javworld.com",
    bundle: "JAV",
    metricName: "Biggest Revenue Drop",
    metricValue: "-$312",
    delta: -41.0,
    explanation:
      "Lost primary pop demand partner. Vast fill rate collapsed from 78% to 12%.",
  },
  {
    id: 4,
    category: "Traffic",
    entity: "gayhub.net",
    bundle: "Gays",
    metricName: "Biggest Traffic Loss",
    metricValue: "-89K visits",
    delta: -32.1,
    explanation:
      "Google deindexed 1.2K pages after content policy review. Organic traffic near zero.",
  },
];

const BEST_SITES: ConclusionCard[] = [
  {
    id: 1,
    category: "Health Score",
    entity: "gaytube1.com",
    bundle: "Gays",
    metricName: "Highest Health",
    metricValue: "94",
    delta: 6.2,
    explanation:
      "All formats above target eCPM. Push opt-in rate hit 14%, highest in bundle.",
  },
  {
    id: 2,
    category: "ROMI",
    entity: "hentaistream.com",
    bundle: "Hentai",
    metricName: "Best ROMI",
    metricValue: "340%",
    delta: 45.8,
    explanation:
      "New outstream placement driving $0.82 eCPM. Costs stable at $312 with $1,375 revenue.",
  },
  {
    id: 3,
    category: "Revenue",
    entity: "javflix.com",
    bundle: "JAV",
    metricName: "Top Revenue",
    metricValue: "$1,847",
    delta: 22.4,
    explanation:
      "Vast pre-roll eCPM jumped to $3.20 after adding tier-1 demand. Pop also up 18%.",
  },
  {
    id: 4,
    category: "Traffic",
    entity: "transtube1.com",
    bundle: "Trans",
    metricName: "Biggest Traffic Gain",
    metricValue: "+127K visits",
    delta: 48.7,
    explanation:
      "Viral content spike from social referrals. Conversion to push subscribers up 3x.",
  },
];

const WORST_FORMATS: ConclusionCard[] = [
  {
    id: 1,
    category: "eCPM",
    entity: "Slider",
    metricName: "Lowest Avg eCPM",
    metricValue: "$0.08",
    delta: -54.2,
    explanation:
      "Slider viewability dropped to 11% across all bundles. Most impressions below fold.",
  },
  {
    id: 2,
    category: "Fill Rate",
    entity: "Vast",
    metricName: "Lowest Fill Rate",
    metricValue: "23%",
    delta: -31.0,
    explanation:
      "Two demand partners paused campaigns. Only one active bidder remaining on Trans and Hentai.",
  },
  {
    id: 3,
    category: "Revenue Share",
    entity: "Banner",
    metricName: "Revenue Drop",
    metricValue: "-$420",
    delta: -28.6,
    explanation:
      "300x250 CTR fell to 0.02%. Advertisers shifting budget to outstream and pop.",
  },
  {
    id: 4,
    category: "CTR",
    entity: "Outstream",
    bundle: undefined,
    metricName: "Lowest CTR",
    metricValue: "0.04%",
    delta: -19.3,
    explanation:
      "Autoplay blocked on 60% of mobile traffic. Completion rate under 15% on Hentai bundle.",
  },
];

const BEST_FORMATS: ConclusionCard[] = [
  {
    id: 1,
    category: "eCPM",
    entity: "Pop",
    metricName: "Highest Avg eCPM",
    metricValue: "$1.24",
    delta: 18.6,
    explanation:
      "Strong demand from dating and gaming verticals. Gays bundle pop eCPM hit $1.67.",
  },
  {
    id: 2,
    category: "Revenue",
    entity: "Push",
    metricName: "Top Revenue Growth",
    metricValue: "+$890",
    delta: 34.2,
    explanation:
      "Subscriber base grew 12% WoW. JAV push notifications averaging 8.4% CTR.",
  },
  {
    id: 3,
    category: "Fill Rate",
    entity: "Banner",
    metricName: "Best Fill Rate",
    metricValue: "97%",
    delta: 4.1,
    explanation:
      "Added two new SSP integrations. Backfill catching remaining 3% on Gays bundle.",
  },
  {
    id: 4,
    category: "Viewability",
    entity: "Outstream",
    metricName: "Best Viewability",
    metricValue: "72%",
    delta: 15.8,
    explanation:
      "Sticky placement on JAV sites boosted viewability. Completion rate up to 45%.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BUNDLE_COLORS: Record<string, string> = {
  Gays: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Trans: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Hentai: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  JAV: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

function BundleBadge({ bundle }: { bundle: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        BUNDLE_COLORS[bundle] ?? "bg-zinc-800 text-zinc-300 border-zinc-700"
      )}
    >
      {bundle}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function ConclusionSection({
  title,
  icon: Icon,
  accent,
  items,
}: {
  title: string;
  icon: React.ElementType;
  accent: "red" | "green";
  items: ConclusionCard[];
}) {
  const borderColor =
    accent === "red" ? "border-red-500/30" : "border-emerald-500/30";
  const iconColor =
    accent === "red" ? "text-red-400" : "text-emerald-400";
  const deltaColor = (delta: number) =>
    delta >= 0 ? "text-emerald-400" : "text-red-400";
  const DeltaIcon = ({ delta }: { delta: number }) =>
    delta >= 0 ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5" />
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-5 w-5", iconColor)} />
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.id} className={cn("relative", borderColor)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {item.category}
                </span>
                {item.bundle && <BundleBadge bundle={item.bundle} />}
              </div>
              <CardTitle className="text-base">{item.entity}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-zinc-100">
                  {item.metricName}:{" "}
                  <span
                    className={
                      accent === "red" ? "text-red-400" : "text-emerald-400"
                    }
                  >
                    {item.metricValue}
                  </span>
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  deltaColor(item.delta)
                )}
              >
                <DeltaIcon delta={item.delta} />
                {item.delta >= 0 ? "+" : ""}
                {item.delta.toFixed(1)}%
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                {item.explanation}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConclusionsPage() {
  const [selectedDate, setSelectedDate] = useState(DATES[0].value);

  return (
    <div className="space-y-8">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">
            Daily Conclusions
          </h1>
          <span className="text-sm text-zinc-500">/ Выводы</span>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-zinc-400" />
          <Select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
          >
            {DATES.map((d) => (
              <SelectOption key={d.value} value={d.value}>
                {d.label}
              </SelectOption>
            ))}
          </Select>
        </div>
      </div>

      {/* ---- Worst Sites ---- */}
      <ConclusionSection
        title="Worst Sites Yesterday"
        icon={AlertTriangle}
        accent="red"
        items={WORST_SITES}
      />

      {/* ---- Best Sites ---- */}
      <ConclusionSection
        title="Best Sites Yesterday"
        icon={CheckCircle}
        accent="green"
        items={BEST_SITES}
      />

      {/* ---- Worst Formats ---- */}
      <ConclusionSection
        title="Worst Formats Yesterday"
        icon={Layers}
        accent="red"
        items={WORST_FORMATS}
      />

      {/* ---- Best Formats ---- */}
      <ConclusionSection
        title="Best Formats Yesterday"
        icon={BarChart3}
        accent="green"
        items={BEST_FORMATS}
      />
    </div>
  );
}
