import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeOnce } from "@/lib/welcome";

// Landing point for links in emails we send ourselves (password reset): checks the one-time token and logs in.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next") ?? "/en/update-password";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/en/update-password";
  const locale = next.startsWith("/ar") ? "ar" : "en";

  if (tokenHash && type === "recovery") {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    if (!error && data.user) {
      // This device becomes the account's only login, as with any other login.
      await supabase.rpc("claim_session");
      await sendWelcomeOnce(data.user.id);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  // Used or expired link: start again from the reset form.
  return NextResponse.redirect(`${origin}/${locale}/reset?expired=1`);
}
