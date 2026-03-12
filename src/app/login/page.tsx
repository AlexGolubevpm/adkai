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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        <div
          className="rounded-xl border p-8"
          style={{
            borderColor: "var(--border)",
            background: "white",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                background: "var(--primary)",
                boxShadow: "0 1px 3px rgba(99, 102, 241, 0.3)",
              }}
            >
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                AdKai
              </h1>
              <p
                className="text-[10px] font-medium uppercase tracking-widest"
                style={{ color: "var(--foreground-subtle)" }}
              >
                Analytics Platform
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--foreground-muted)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  background: "white",
                }}
                placeholder="admin@adkai.com"
                required
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--foreground-muted)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  background: "white",
                }}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div
                className="rounded-lg px-3 py-2"
                style={{
                  background: "var(--danger-light)",
                  border: "1px solid var(--danger-muted)",
                }}
              >
                <p className="text-xs" style={{ color: "var(--danger)" }}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: "var(--primary)",
                boxShadow: "0 1px 3px rgba(99, 102, 241, 0.3)",
              }}
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
