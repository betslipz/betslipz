import { NextResponse, type NextRequest } from "next/server";
import { adminPaymentEmail, expiryEmail, resetEmail, welcomeEmail } from "@/lib/emails";
import { siteUrl } from "@/lib/email";

// Local only: shows each email in the browser, e.g. /api/dev/email-preview?kind=expiry&locale=ar
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  const kind = request.nextUrl.searchParams.get("kind") ?? "welcome";
  const locale = request.nextUrl.searchParams.get("locale") === "ar" ? "ar" : "en";
  const soon = new Date(Date.now() + 2 * 864e5).toISOString();
  const email =
    kind === "reset"
      ? resetEmail(locale, `${siteUrl()}/auth/confirm?token_hash=example&type=recovery&next=/${locale}/update-password`)
      : kind === "expiry"
        ? expiryEmail(locale, "Sami", locale === "ar" ? "🎾 التنس" : "🎾 Tennis", soon, `${siteUrl()}/${locale}/subscribe?sport=tennis`)
        : kind === "admin"
          ? adminPaymentEmail({ buyer: "member@example.com", buyerName: "Sami", phone: "+961 70 000 000", item: "🎾 Tennis · Month", amount: "$9", method: "Whish Money", reference: "WH-123456", hasReceipt: true })
          : welcomeEmail(locale, "Sami");
  return new NextResponse(email.html, { headers: { "content-type": "text/html; charset=utf-8", "x-email-subject": encodeURIComponent(email.subject) } });
}
