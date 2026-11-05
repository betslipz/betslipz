import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeOnce } from "@/lib/welcome";

// Landing point for email confirmation and password-reset links.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/en/slips";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/en/slips";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Email confirmation and password reset log in too: this device becomes the account's only login.
      await supabase.rpc("claim_session");
      await sendWelcomeOnce(data.user.id);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/en/login`);
}
