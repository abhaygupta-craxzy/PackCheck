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
  Sparkles,
  Award,
  CheckCircle2,
  User,
  MapPin,
  BadgeCheck,
  Loader2,
  Scale,
  Shield,
  FileCheck,
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
      setFullName("Priya Verma");
      setOrgOrCity("Pune, Maharashtra");
      setEmail("priya.verma@gmail.com");
    } else {
      setRole("investigator");
      setFullName("Officer R. Sharma");
      setOrgOrCity("Legal Metrology Dept, Maharashtra");
      setEmail("officer.sharma@legalmetrology.gov.in");
    }
  }, [queryRole]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === "investigator") {
      setFullName("Officer R. Sharma");
      setOrgOrCity("Legal Metrology Dept, Maharashtra");
      setEmail("officer.sharma@legalmetrology.gov.in");
    } else {
      setFullName("Priya Verma");
      setOrgOrCity("Pune, Maharashtra");
      setEmail("priya.verma@gmail.com");
    }
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
            organization_or_city: orgOrCity.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Account could not be created.");
      }

      // If email confirmation is required by Supabase
      if (!data.session) {
        setStatusMessage(
          "Account created! Please check your email inbox to confirm your account."
        );
        return;
      }

      // Upsert profile in public.profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            email: email.trim(),
            full_name: fullName.trim(),
            role,
            designation: role === "investigator" ? "Legal Metrology Inspector" : "Consumer",
          },
          {
            onConflict: "id",
          }
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

  const handleQuickRegisterPrefill = (targetRole: Role) => {
    setRole(targetRole);
    if (targetRole === "investigator") {
      setFullName("Officer R. Sharma");
      setOrgOrCity("Legal Metrology Dept, Maharashtra");
      setEmail("officer.sharma@legalmetrology.gov.in");
      setPassword("GovOfficer#2026");
    } else {
      setFullName("Priya Verma");
      setOrgOrCity("Pune, Maharashtra");
      setEmail("priya.verma@gmail.com");
      setPassword("CitizenSafe#2026");
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

              {/* Fast Demo Pre-fill */}
              <div className="mt-8 p-4 rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Jury Demo Quick Pre-fill:
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Pre-fill
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickRegisterPrefill("investigator")}
                    className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-left text-xs font-bold text-blue-950 transition cursor-pointer flex items-center justify-between"
                  >
                    <span>🛡️ Fill Investigator</span>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRegisterPrefill("consumer")}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-left text-xs font-bold text-emerald-950 transition cursor-pointer flex items-center justify-between"
                  >
                    <span>👤 Fill Consumer</span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
                  </button>
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
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-full"
              >
                Sign In
              </Link>
            </div>

            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-extrabold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Account Registration
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Create your account
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Get started with PackCheck compliance intelligence.
              </p>
            </div>

            {/* Role Selector */}
            <div className="mb-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleChange("investigator")}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    role === "investigator"
                      ? "border-blue-600 bg-blue-50/80 shadow-sm ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${role === "investigator" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border"}`}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Investigator</p>
                      <p className="text-[10px] text-blue-700 font-semibold">Enforcement</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("consumer")}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    role === "consumer"
                      ? "border-emerald-600 bg-emerald-50/80 shadow-sm ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${role === "consumer" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border"}`}>
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Consumer</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">Public Citizen</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">

              {/* Full Name */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-10.5 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              {/* Organization or City */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  {role === "investigator" ? "Official Organization / Department" : "City / Location"}
                </label>
                <div className="relative">
                  {role === "investigator" ? (
                    <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  ) : (
                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  )}
                  <input
                    type="text"
                    required
                    value={orgOrCity}
                    onChange={(e) => setOrgOrCity(e.target.value)}
                    placeholder={role === "investigator" ? "Legal Metrology Dept, Maharashtra" : "City name"}
                    className="h-10.5 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  {role === "investigator" ? "Official Government / Officer Email" : "Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === "investigator" ? "officer@legalmetrology.gov.in" : "you@example.com"}
                    className="h-10.5 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min. 8 characters)"
                    className="h-10.5 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                      <span>Strength: <strong className="text-slate-800">{strength.label}</strong></span>
                      <span>8+ chars required</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-600 font-medium leading-tight">
                  I agree to the Legal Metrology Compliance Guidelines &amp; platform Terms of Service.
                </span>
              </label>

              {statusMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  {statusMessage}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className={`group mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-extrabold text-white transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 ${
                  role === "investigator"
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25"
                    : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create {role === "investigator" ? "Investigator" : "Consumer"} Account</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

            </form>

            {/* Back to Login Link */}
            <p className="mt-6 text-center text-xs font-medium text-slate-600">
              Already have an account?{" "}
              <Link
                href={`/login?role=${role}`}
                className="font-extrabold text-blue-700 hover:text-blue-800 hover:underline transition"
              >
                Sign in here
              </Link>
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center font-bold">Loading PackCheck Registration...</div>}>
      <SignupForm />
    </Suspense>
  );
}
