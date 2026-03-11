"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  DollarSign,
  FileText,
  Brain,
  Activity,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & KPIs",
  },
  {
    label: "Sites",
    href: "/sites",
    icon: Globe,
    description: "All websites",
  },
  {
    label: "Costs",
    href: "/costs",
    icon: DollarSign,
    description: "Budget tracking",
  },
  {
    label: "Conclusions",
    href: "/conclusions",
    icon: FileText,
    description: "Daily insights",
  },
  {
    label: "Forecast",
    href: "/forecast",
    icon: TrendingUp,
    description: "CPM & revenue modeling",
  },
  {
    label: "Analysis",
    href: "/analysis",
    icon: Brain,
    description: "AI analysis",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-[var(--border)] bg-[var(--surface-0)]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-[var(--border)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-sm shadow-indigo-500/25">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-[var(--foreground)] tracking-tight">
            AdKai
          </span>
          <span className="text-[10px] font-medium text-[var(--foreground-subtle)] uppercase tracking-widest">
            Analytics
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--foreground-subtle)]">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "bg-[var(--surface-2)] text-[var(--foreground-subtle)] group-hover:text-[var(--foreground-muted)]"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight">{item.label}</span>
                <span
                  className={cn(
                    "text-[10px] leading-tight transition-colors",
                    isActive
                      ? "text-indigo-400/60"
                      : "text-[var(--foreground-subtle)]"
                  )}
                >
                  {item.description}
                </span>
              </div>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs text-[var(--foreground-subtle)]">
            System online
          </span>
        </div>
      </div>
    </aside>
  );
}
