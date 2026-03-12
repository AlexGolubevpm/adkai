"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  value: "",
  onChange: () => {},
});

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg p-1",
        className
      )}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx.value === value;

  return (
    <button
      onClick={() => ctx.onChange(value)}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
        isActive
          ? "bg-white text-[var(--foreground)] shadow-sm"
          : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;

  return (
    <div className={cn("animate-fade-in", className)}>
      {children}
    </div>
  );
}
