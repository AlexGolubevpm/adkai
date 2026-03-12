"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Heart } from "lucide-react";

interface HealthBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

function getHealthVariant(score: number): "healthy" | "warning" | "critical" {
  if (score >= 80) return "healthy";
  if (score >= 60) return "warning";
  return "critical";
}

function getHealthLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Warning";
  return "Critical";
}

function getHealthColor(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--warning)";
  return "var(--danger)";
}

export function HealthBadge({ score, size = "sm", showLabel = true, showTooltip = true, className }: HealthBadgeProps) {
  const variant = getHealthVariant(score);
  const label = getHealthLabel(score);

  const badge = (
    <Badge
      variant={variant}
      className={cn(
        "gap-1 tabular-nums",
        size === "lg" && "text-sm px-3 py-1",
        size === "md" && "text-xs px-2.5 py-0.5",
        className
      )}
    >
      <Heart className={cn("fill-current", size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3")} />
      {score}
      {showLabel && <span className="ml-0.5 font-normal">{label}</span>}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">
          Health Score: <span className="font-bold">{score}/100</span>
          <br />
          Based on profit, ROMI, revenue stability, traffic trends, and format diversification.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function HealthDot({ score, className }: { score: number; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("inline-block h-2.5 w-2.5 rounded-full shrink-0", className)}
          style={{ background: getHealthColor(score) }}
        />
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">Health: {score}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function HealthBar({ score, className }: { score: number; className?: string }) {
  const color = getHealthColor(score);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn("h-1.5 w-16 rounded-full overflow-hidden", className)}
          style={{ background: "var(--surface-3)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, background: color }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">Health: {score}/100 — {getHealthLabel(score)}</p>
      </TooltipContent>
    </Tooltip>
  );
}
