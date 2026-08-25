"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  Building2,
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  User,
  MapPin,
  Loader2,
  Scale,
} from "lucide-react";

type Role = "consumer" | "investigator";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRole = searchParams.get("role");

  const [role, setRole] = useState<Role>(
    queryRole === "consumer" ? "consumer" : "investigator"
  );
  const [fullName, setFullName] = useState("");
  const [orgOrCity, setOrgOrCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (queryRole === "consumer") {
      setRole("consumer");
    } else if (queryRole === "investigator") {
      setRole("investigator");
    }
  }, [queryRole]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Enter password", color: "bg-slate-200" };
    if (pass.length < 6) return { score: 30, label: "Weak", color: "bg-rose-500" };
    if (pass.length < 8) return { score: 65, label: "Good", color: "bg-amber-500" };
    return { score: 100, label: "Strong & Regulatory-compliant", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setStatusMessage(null);
      alert("Password must contain at least 8 characters.");
      return;
    }

    setIsLoading(true);

    setStatusMessage(
      `Creating ${
        role === "investigator"
          ? "Investigator Officer Profile"
          : "Citizen Consumer Account"
      }...`
    );

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            designation: role === "investigator" ? "Legal Metrology Inspector" : "Consumer",
            org_or_city: orgOrCity.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Registration initiated but no user record was returned.");
      }

      // Upsert profile in public.profiles
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: email.trim(),
          full_name: fullName.trim(),
          role,
          designation:
            role === "investigator"
              ? "Legal Metrology Inspector"
              : "Consumer",
          badge_number:
            role === "investigator"
              ? `LM-INSP-${Math.floor(1000 + Math.random() * 9000)}`
              : null,
          is_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Profile sync notice:", profileError);
      }

      setStatusMessage("Account created successfully. Opening PackCheck...");

      router.push(role === "investigator" ? "/investigator" : "/consumer");
    } catch (error) {
      console.error("PackCheck signup error:", error);

      setStatusMessage(null);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to create your account.";

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      const msg = err instanceof Error ? err.message : "Failed to initialize Google signup.";
      alert(msg);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">

        {/* =========================================================
            LEFT — SHOWCASE SIDE (VIBRANT LIGHT THEME)
        ========================================================== */}
        <section className="relative hidden overflow-hidden lg:flex border-r border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">

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

            {/* Top Logo */}
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

            {/* Main Content */}
            <div className="max-w-xl my-auto py-8">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 px-3.5 py-1.5 text-xs font-bold text-emerald-900 shadow-xs">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Join the Legal Metrology Compliance Network</span>
              </div>

              <h1 className="text-4xl font-black leading-[1.12] tracking-tight text-slate-900 xl:text-5xl">
                Register for{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                  evidence-backed
                </span>{" "}
                compliance intelligence.
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-600 font-medium">
                Create your verified inspector credentials or citizen consumer access account to evaluate packaged commodity labels with instant rule verification.
              </p>

              {/* Benefits Checklist */}
              <div className="mt-8 space-y-3 max-w-md">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Deterministic Legal Metrology (PCR 2011) Engine</p>
                    <p className="text-[11px] text-slate-500">Automated checking of MRP, Net Qty font heights, and unit sale prices.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Official Forensic Evidentiary Dockets</p>
                    <p className="text-[11px] text-slate-500">Trace every finding back to original package bounding boxes and OCR tokens.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-6 text-xs text-slate-500 font-medium">
              <span>Smart India Hackathon 2026 • Problem Statement 26034</span>
              <span>© 2026 PackCheck India</span>
            </div>

          </div>
        </section>

        {/* =========================================================
            RIGHT — SIGN UP FORM (REAL SUPABASE AUTH)
        ========================================================== */}
        <section className="flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-12 relative overflow-hidden">

          <div className="w-full max-w-md relative z-10">

            {/* Mobile logo */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold text-slate-900">PackCheck</span>
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition bg-slate-100 px-3 py-1.5 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
                Sign In
              </Link>
            </div>

            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-extrabold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                New User Onboarding
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Create an Account
              </h2>

              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Select your account tier and register on the PackCheck platform.
              </p>
            </div>

            {/* Role Selection Tabs */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Account Tier
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleChange("investigator")}
                  className={`rounded-2xl border-2 p-3 text-left transition-all duration-200 cursor-pointer ${
                    role === "investigator"
                      ? "border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-slate-900">Investigator</span>
                  </div>
                  <p className="text-[10px] font-semibold text-blue-700">Enforcement Officer</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("consumer")}
                  className={`rounded-2xl border-2 p-3 text-left transition-all duration-200 cursor-pointer ${
                    role === "consumer"
                      ? "border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserRound className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-slate-900">Consumer</span>
                  </div>
                  <p className="text-[10px] font-semibold text-emerald-700">Citizen Access</p>
                </button>
              </div>
            </div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-xs hover:shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon />
              <span>Sign up with Google</span>
            </button>

            {/* Divider */}
            <div className="my-4 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Or fill details below
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === "investigator" ? "e.g. Officer R. Sharma" : "e.g. Priya Verma"}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  {role === "investigator" ? "Department / Jurisdiction / Office" : "City / Location"}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={orgOrCity}
                    onChange={(e) => setOrgOrCity(e.target.value)}
                    placeholder={role === "investigator" ? "e.g. Legal Metrology Dept, Maharashtra" : "e.g. Mumbai, Maharashtra"}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Create Password
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    Min. 8 characters
                  </span>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="terms" className="text-[11px] text-slate-600 leading-tight">
                  I agree to the{" "}
                  <span className="font-bold text-slate-900">Legal Metrology Compliance Terms</span> and privacy guidelines.
                </label>
              </div>

              {statusMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 animate-in fade-in">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-emerald-600" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-xs font-extrabold text-white shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 ${
                  role === "investigator"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create {role === "investigator" ? "Inspector" : "Consumer"} Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>

            <div className="mt-6 text-center text-xs font-medium text-slate-500">
              Already have an account?{" "}
              <Link
                href={`/login?role=${role}`}
                className="font-bold text-emerald-700 hover:text-emerald-800 transition"
              >
                Sign in
              </Link>
            </div>

          </div>

        </section>

      </div>
    </main>
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
