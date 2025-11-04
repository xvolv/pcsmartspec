"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { isAuthenticated } from "@/lib/auth/utils";


export default function LoginPage() {
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const emailTrim = email.trim();
      const passwordTrim = password.trim();

      if (!emailTrim || !passwordTrim) {
        throw new Error("Email and password are required");
      }

      const isSixDigit = /^\d{6}$/.test(passwordTrim);
      if (!isSixDigit) {
        throw new Error("Password must be a 6-digit code");
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrim, password: passwordTrim }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Invalid email or password");
      }

      const store = remember ? localStorage : sessionStorage;
      store.setItem("rsc_user_id", String(data.id));
      store.setItem("rsc_email", String(data.email));
      store.setItem("rsc_authed", "1");

      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">
            Royal Smart Computer
          </h1>
          <p className="text-slate-500 mt-2 font-light">
            Sign in to your account
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-8 shadow-sm border border-slate-200/60">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-normal text-slate-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-normal text-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 my-auto h-8 w-8 inline-flex items-center justify-center text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-400 text-slate-700 focus:ring-slate-300"
                />
                Remember me
              </label>
              <Link
                href="/forget"
                className="text-slate-600 hover:text-slate-800 transition-colors duration-200 font-light"
              >
                Forgot password?
              </Link>
            </div>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3.5 text-white text-sm font-medium shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
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
