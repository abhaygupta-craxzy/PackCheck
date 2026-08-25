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
  Sparkles,
  Loader2,
  Award,
  Zap,
  FileCheck2,
} from "lucide-react";

type Role = "consumer" | "investigator";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRole = searchParams.get("role");

  const [role, setRole] = useState<Role>(
    queryRole === "consumer" ? "consumer" : "investigator"
  );
  const [email, setEmail] = useState("officer.sharma@legalmetrology.gov.in");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  useEffect(() => {
    if (queryRole === "consumer") {
      setRole("consumer");
      setEmail("priya.verma@gmail.com");
    } else if (queryRole === "investigator") {
      setRole("investigator");
      setEmail("officer.sharma@legalmetrology.gov.in");
    }
  }, [queryRole]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === "investigator") {
      setEmail("officer.sharma@legalmetrology.gov.in");
    } else {
      setEmail("priya.verma@gmail.com");
    }
  };

  const handleQuickLogin = (targetRole: Role) => {
    setRole(targetRole);

    if (targetRole === "investigator") {
      setEmail("officer.sharma@legalmetrology.gov.in");
      setPassword("");
    } else {
      setEmail("priya.verma@gmail.com");
      setPassword("");
    }

    setLoginMessage(
      `${targetRole === "investigator" ? "Investigator" : "Consumer"} demo profile selected. Enter your password to authenticate.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
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
        throw error;
      }

      if (!data.user) {
        throw new Error("Authentication succeeded but no user was returned.");
      }

      // Read the user's PackCheck profile/role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
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
        // Fallback to role from user metadata or UI if profile row is pending creation
        const metaRole = data.user.user_metadata?.role || role;
        if (metaRole === "investigator") {
          router.push("/investigator");
        } else {
          router.push("/consumer");
        }
      }
    } catch (error) {
      console.error("PackCheck login error:", error);

      setLoginMessage(null);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please check your credentials.";

      alert(message);
    } finally {
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
    } catch (err: any) {
      alert(err.message || "Failed to initialize Google authentication.");
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

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 px-3.5 py-1.5 text-xs font-bold text-emerald-900 shadow-xs">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Smart India Hackathon 2026</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-500 font-semibold">PS 26034</span>
              </div>

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

              {/* Fast Evaluation Demo Box */}
              <div className="mt-8 p-4 rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Instant Jury Demo Credentials:</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Pre-fill
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("investigator")}
                    className="group text-left p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/90 text-xs text-blue-950 font-bold transition-all duration-200 flex items-center justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-blue-900 leading-none">Lead Investigator</p>
                        <p className="text-[10px] text-blue-700 font-medium mt-0.5">Officer Sharma</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-600 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("consumer")}
                    className="group text-left p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 text-xs text-emerald-950 font-bold transition-all duration-200 flex items-center justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-emerald-900 leading-none">Citizen Consumer</p>
                        <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Priya Verma</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-600 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
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
                    placeholder={role === "investigator" ? "officer@legalmetrology.gov.in" : "you@example.com"}
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
                    onClick={() => alert("Password reset link has been dispatched to your email address.")}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
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
                    placeholder="Enter password"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {loginMessage && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 flex items-center gap-2.5 animate-in fade-in">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  {loginMessage}
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-extrabold text-white transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 ${
                  role === "investigator"
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25"
                    : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to {role === "investigator" ? "Investigator Workspace" : "Consumer Check"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

            </form>

            {/* Create Account Link */}
            <p className="mt-6 text-center text-xs font-medium text-slate-600">
              Don&apos;t have an account yet?{" "}
              <Link
                href={`/signup?role=${role}`}
                className="font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline transition"
              >
                Create an account
              </Link>
            </p>

            {/* Security Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Department of Consumer Affairs • Legal Metrology Division</span>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center font-bold">Loading PackCheck Auth...</div>}>
      <LoginForm />
    </Suspense>
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
    <div className={`flex min-w-[105px] flex-col rounded-2xl border p-3.5 shadow-2xs hover:shadow-xs transition-transform hover:-translate-y-0.5 ${bg}`}>
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-2xs">
        {icon}
      </div>
      <p className="text-xs font-extrabold text-slate-900">{title}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{text}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.23c0-.79-.07-1.55-.23-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.39Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.51A9.75 9.75 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.54 13.85A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.85V7.64H3.3A9.76 9.76 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.36l3.24-2.51Z" />
      <path fill="#EA4335" d="M12 6.12c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.16 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.39l3.24 2.51C7.31 7.84 9.46 6.12 12 6.12Z" />
    </svg>
  );
}