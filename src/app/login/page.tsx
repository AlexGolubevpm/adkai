"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-8 shadow-2xl shadow-black/20">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 shadow-sm shadow-indigo-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                AdKai
              </h1>
              <p className="text-[10px] font-medium text-[var(--foreground-subtle)] uppercase tracking-widest">
                Analytics Platform
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                placeholder="admin@adkai.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all duration-150 shadow-sm shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
