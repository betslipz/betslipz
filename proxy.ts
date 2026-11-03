import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_LOCALE, isLocale } from "@/lib/config";

// Runs before every page: adds a locale prefix and keeps the Supabase session fresh.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (!isLocale(first) && !pathname.startsWith("/auth")) {
    const preferred = request.cookies.get("locale")?.value;
    const accept = request.headers.get("accept-language") ?? "";
    const locale = preferred && isLocale(preferred) ? preferred : accept.startsWith("ar") ? "ar" : DEFAULT_LOCALE;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Coarse guard; every protected page and action re-checks on the server, and RLS checks again.
  const section = pathname.split("/")[2];
  if (!user && (section === "account" || section === "admin" || section === "subscribe")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/login`;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
