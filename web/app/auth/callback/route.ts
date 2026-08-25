import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check user role from profile to redirect correctly
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = profile?.role;
        if (role === "investigator" || role === "supervisor" || role === "admin") {
          return NextResponse.redirect(`${origin}/investigator`);
        } else if (role === "consumer") {
          return NextResponse.redirect(`${origin}/consumer`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return user to login page with error notice if code exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
