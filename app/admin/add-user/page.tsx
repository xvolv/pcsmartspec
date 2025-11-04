"use client";
import Navbar from "@/app/components/Navbar";
import { useState } from "react";

export default function AddUserPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      if (!email || !code) throw new Error("All fields are required");
      if (!/^\d{6}$/.test(code)) throw new Error("Code must be 6 digits");

      const res = await fetch("/api/auth/seed-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create user");
      setStatus("User created successfully");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <Navbar />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-800">Add User</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Create a test user to sign in.
          </p>
        </div>

        <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-sm border border-slate-200/60">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="code"
                className="block text-sm text-slate-700 mb-2"
              >
                Assign password
              </label>
              <input
                id="code"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none transition-all duration-200"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {status && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3.5 text-white text-sm font-medium shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Creating..." : "Create user"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
