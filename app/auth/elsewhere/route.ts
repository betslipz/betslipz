import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/config";

// Where getSession() sends a device whose account has since logged in elsewhere: log this device out, then explain why.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });

  const preferred = request.nextUrl.searchParams.get("locale") ?? request.cookies.get("locale")?.value;
  const locale = preferred && isLocale(preferred) ? preferred : DEFAULT_LOCALE;
  const response = NextResponse.redirect(new URL(`/${locale}/login?reason=elsewhere`, request.url));
  // Drop the auth cookies even if the sign-out call failed, so this can't loop.
  for (const c of request.cookies.getAll()) if (c.name.startsWith("sb-")) response.cookies.delete(c.name);
  return response;
}
