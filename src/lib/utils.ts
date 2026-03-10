import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}

export function formatCurrency(n: number): string {
  return "$" + n.toFixed(2);
}

export function formatPercent(n: number): string {
  return n.toFixed(1) + "%";
}

export function getHealthStatus(score: number): "healthy" | "warning" | "critical" {
  if (score >= 80) return "healthy";
  if (score >= 60) return "warning";
  return "critical";
}

export function getHealthColor(status: string): string {
  switch (status) {
    case "healthy": return "text-emerald-400";
    case "warning": return "text-yellow-400";
    case "critical": return "text-red-400";
    default: return "text-gray-400";
  }
}

export function getHealthBg(status: string): string {
  switch (status) {
    case "healthy": return "bg-emerald-400/10 border-emerald-400/20";
    case "warning": return "bg-yellow-400/10 border-yellow-400/20";
    case "critical": return "bg-red-400/10 border-red-400/20";
    default: return "bg-gray-400/10 border-gray-400/20";
  }
}

export function calculateRomi(revenue: number, costs: number): number {
  if (costs === 0) return 0;
  return ((revenue - costs) / costs) * 100;
}

export function calculateRevenuePer1000(revenue: number, traffic: number): number {
  if (traffic === 0) return 0;
  return (revenue / traffic) * 1000;
}

export function calculateProfit(revenue: number, costs: number): number {
  return revenue - costs;
}
