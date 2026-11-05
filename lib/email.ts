import "server-only";
import { SITE_NAME, type Locale } from "@/lib/config";

// Emails go out through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
// Until a domain is verified in Resend, the default sender can only deliver to the Resend account's own address.

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const adminEmail = () => process.env.ADMIN_NOTIFY_EMAIL || "betslipzz@gmail.com";
const from = () => process.env.EMAIL_FROM || `${SITE_NAME} <onboarding@resend.dev>`;

export type Email = { to: string; subject: string; html: string; text: string };

// Never throws: a failed email must not break signing in or paying. Returns whether Resend accepted it.
export async function sendEmail(email: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY missing; not sent: "${email.subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: from(), ...email }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[email] Resend refused "${email.subject}": ${res.status} ${await res.text()}`);
    return res.ok;
  } catch (e) {
    console.error(`[email] could not reach Resend for "${email.subject}":`, e);
    return false;
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// One simple, inline-styled layout that email apps render the same way; right-to-left for Arabic.
// Paragraphs are plain text (escaped); `button` is an optional call to action.
export function layout({
  locale,
  title,
  paragraphs,
  button,
  footer,
}: {
  locale: Locale;
  title: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  footer: string;
}): { html: string; text: string } {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<body style="margin:0;padding:0;background:#0b1020;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1020;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#1e2160;border-bottom:3px solid #d9a521;padding:18px 24px;color:#ffffff;font-size:22px;font-weight:bold;" dir="ltr" align="${align}">${esc(SITE_NAME)}</td></tr>
        <tr><td dir="${dir}" style="padding:24px;color:#1b1f4b;text-align:${align};font-size:15px;line-height:1.6;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#1b1f4b;">${esc(title)}</h1>
          ${paragraphs.map((p) => `<p style="margin:0 0 12px;">${esc(p)}</p>`).join("\n          ")}
          ${
            button
              ? `<p style="margin:24px 0 8px;"><a href="${esc(button.url)}" style="display:inline-block;background:#22c55e;color:#04130a;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;">${esc(button.label)}</a></p>
          <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;" dir="ltr">${esc(button.url)}</p>`
              : ""
          }
        </td></tr>
        <tr><td dir="${dir}" style="padding:16px 24px;background:#eeeefb;color:#4b5280;font-size:12px;line-height:1.5;text-align:${align};">${esc(footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const text = [title, "", ...paragraphs, ...(button ? ["", `${button.label}: ${button.url}`] : []), "", footer].join("\n");
  return { html, text };
}
