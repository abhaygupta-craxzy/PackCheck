"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  ScanSearch,
  ArrowRight,
  CheckCircle2,
  Building2,
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  Loader2,
  Award,
  Zap,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";

type Role = "consumer" | "investigator";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRole = searchParams.get("role");

  const [role, setRole] = useState<Role>(
    queryRole === "consumer" ? "consumer" : "investigator"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (queryRole === "consumer") {
      setRole("consumer");
    } else if (queryRole === "investigator") {
      setRole("investigator");
    }
  }, [queryRole]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setAuthError(null);
  };

  const handlePrefillDemo = (demoRole: Role) => {
    setRole(demoRole);
    setAuthError(null);
    if (demoRole === "investigator") {
      setEmail("officer@packcheck.in");
      setPassword("Pack@123");
    } else {
      setEmail("user@packcheck.in");
      setPassword("User@123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setAuthError(null);
    setLoginMessage(
      `Authenticating as ${
        role === "investigator"
          ? "Legal Metrology Enforcement Officer"
          : "Citizen / Consumer"
      }...`
    );

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Check if demo fallback applies for local testing
        if (
          (email.trim() === "officer@packcheck.in" && password === "Pack@123") ||
          (email.trim() === "user@packcheck.in" && password === "User@123")
        ) {
          setLoginMessage("Demo authenticated. Opening workspace...");
          setTimeout(() => {
            if (role === "investigator" || email.includes("officer")) {
              router.push("/investigator");
            } else {
              router.push("/consumer");
            }
          }, 400);
          return;
        }

        setAuthError(
          error.message === "Invalid login credentials"
            ? "Invalid email or password. Use demo buttons below or check your credentials."
            : error.message
        );
        setIsLoading(false);
        setLoginMessage(null);
        return;
      }

      if (!data.user) {
        setAuthError("Authentication succeeded but no user session was returned.");
        setIsLoading(false);
        setLoginMessage(null);
        return;
      }

      // Read the user's PackCheck profile/role using the authenticated user's UUID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, designation")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Profile fetch notice:", profileError.message);
      }

      const actualRole = profile?.role;

      // Database profile is the source of truth
      if (actualRole === "investigator" || actualRole === "supervisor" || actualRole === "admin") {
        setLoginMessage("Authentication successful. Opening Investigator Workspace...");
        router.push("/investigator");
      } else if (actualRole === "consumer") {
        setLoginMessage("Authentication successful. Opening Consumer Check...");
        router.push("/consumer");
      } else {
        // Fallback to role from user metadata or UI selection if profile row is pending
        const metaRole = data.user.user_metadata?.role || role;
        if (metaRole === "investigator") {
          setLoginMessage("Authentication successful. Opening Investigator Workspace...");
          router.push("/investigator");
        } else {
          setLoginMessage("Authentication successful. Opening Consumer Check...");
          router.push("/consumer");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please check your credentials.";
      setAuthError(message);
      setLoginMessage(null);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Google OAuth error:", error);
        alert(error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initialize Google authentication.";
      alert(msg);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">

        {/* =========================================================
            LEFT — BRAND / SHOWCASE SIDE (LIGHT + VIBRANT)
        ========================================================== */}
        <section className="relative hidden overflow-hidden lg:flex border-r border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/40">

          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-300/10 blur-3xl" />
          <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/15 to-indigo-400/10 blur-3xl" />

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 w-fit group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-md shadow-emerald-600/30 text-white transition-transform duration-300 group-hover:scale-105">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <div className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-600 transition">
                  PackCheck
                </div>
                <div className="text-[10px] uppercase font-bold tracking-[0.18em] bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Legal Metrology Intelligence
                </div>
              </div>
            </Link>

            {/* Center Content */}
            <div className="max-w-xl my-auto py-8">

              {/* <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 px-3.5 py-1.5 text-xs font-bold text-emerald-900 shadow-xs">
                <Award className="h-4 w-4 text-emerald-600" />
                {/* <span>Smart India Hackathon 2026</span> */}
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {/* <span className="text-slate-500 font-semibold">PS 26034</span> */}
              {/* </div> */} 

              <h1 className="text-4xl font-black leading-[1.12] tracking-tight text-slate-900 xl:text-5xl">
                Turn package labels into{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                  compliance intelligence.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-600 font-medium">
                AI-assisted extraction of mandatory packaged commodity declarations backed by deterministic Legal Metrology Rules (PCR 2011) with forensic evidence traceability.
              </p>

              {/* Flow Cards */}
              <div className="mt-8 flex items-center gap-3">
                <FlowCard
                  icon={<ScanSearch className="h-5 w-5 text-blue-600" />}
                  bg="bg-blue-50 border-blue-200/80"
                  title="01 Scan & OCR"
                  text="Label Extraction"
                />

                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />

                <FlowCard
                  icon={<Zap className="h-5 w-5 text-indigo-600" />}
                  bg="bg-indigo-50 border-indigo-200/80"
                  title="02 PCR Rules"
                  text="Deterministic Check"
                />

                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />

                <FlowCard
                  icon={<FileCheck2 className="h-5 w-5 text-emerald-600" />}
                  bg="bg-emerald-50 border-emerald-200/80"
                  title="03 Evidence"
                  text="Investigator Review"
                />
              </div>

            </div>

            {/* Bottom Credits */}
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                AI-assisted • Rule-driven • Evidence-backed
              </span>

              <span>
                © 2026 PackCheck India
              </span>
            </div>

          </div>
        </section>

        {/* =========================================================
            RIGHT — SIGN IN CARD (REAL SUPABASE AUTH)
        ========================================================== */}
        <section className="flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-12 relative overflow-hidden">

          <div className="w-full max-w-md relative z-10">

            {/* Mobile logo */}
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold text-slate-900">PackCheck</span>
              </Link>

              <Link
                href="/"
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition bg-slate-100 px-3 py-1.5 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
                Home
              </Link>
            </div>

            {/* Header */}
            <div className="mb-7">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/80 px-3 py-1 text-xs font-extrabold text-blue-800">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                Authentication Portal
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Sign in to PackCheck
              </h2>

              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Enter your credentials to access the Legal Metrology platform.
              </p>
            </div>

            {/* Role Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Select User Role
                </p>
                <span className="text-[11px] font-bold text-slate-500">
                  {role === "investigator" ? "Authorized Official" : "Public Consumer"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">

                {/* Investigator */}
                <button
                  type="button"
                  onClick={() => handleRoleChange("investigator")}
                  className={`group rounded-2xl border-2 p-4 text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    role === "investigator"
                      ? "border-blue-600 bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/60"
                  }`}
                >
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                      role === "investigator"
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 scale-105"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        Investigator
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-blue-700">
                        Inspect & audit
                      </p>
                    </div>

                    {role === "investigator" && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600 fill-blue-100" />
                    )}
                  </div>
                </button>

                {/* Consumer */}
                <button
                  type="button"
                  onClick={() => handleRoleChange("consumer")}
                  className={`group rounded-2xl border-2 p-4 text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    role === "consumer"
                      ? "border-emerald-600 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/60"
                  }`}
                >
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                      role === "consumer"
                        ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        Consumer
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                        Check a package
                      </p>
                    </div>

                    {role === "consumer" && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                    )}
                  </div>
                </button>

              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-xs hover:shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Or with email &amp; password
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {role === "investigator" ? "Official Officer ID / Email" : "Consumer Email Address"}
                </label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === "investigator" ? "officer@packcheck.in" : "user@packcheck.in"}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => alert("Password reset functionality is connected to your registered email.")}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Auth Error Banner */}
              {authError && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-3.5 text-xs text-rose-900 space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 font-semibold">{authError}</div>
                  </div>
                  <div className="pt-1.5 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-rose-700 font-bold">Quick Demo Login:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrefillDemo("investigator")}
                        className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold hover:bg-blue-200 transition cursor-pointer"
                      >
                        Officer
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrefillDemo("consumer")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 transition cursor-pointer"
                      >
                        Consumer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Message */}
              {loginMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2.5 text-xs font-bold text-blue-800 animate-in fade-in">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-blue-600" />
                  <span>{loginMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-xs font-extrabold text-white shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 ${
                  role === "investigator"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to {role === "investigator" ? "Enforcement Workspace" : "Consumer Portal"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>

            {/* Sign up prompt */}
            <div className="mt-8 text-center text-xs font-medium text-slate-500">
              Don&apos;t have an official account?{" "}
              <Link
                href={`/signup?role=${role}`}
                className="font-bold text-blue-700 hover:text-blue-800 transition"
              >
                Create account
              </Link>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

function FlowCard({
  icon,
  bg,
  title,
  text,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  text: string;
}) {
  return (
    <div className={`flex-1 rounded-2xl border p-3.5 shadow-2xs backdrop-blur-xs ${bg}`}>
      <div className="mb-2">{icon}</div>
      <p className="text-xs font-black tracking-tight text-slate-900">{title}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{text}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}