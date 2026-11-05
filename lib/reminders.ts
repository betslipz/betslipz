import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { sendEmail, siteUrl } from "@/lib/email";
import { expiryEmail } from "@/lib/emails";
import { planLabel } from "@/lib/plans";
import type { Sport } from "@/lib/sports";

// Runs once a day. A plan ending 1½–2½ days from now gets one "your plan ends soon" email,
// so with a daily run every plan is reminded about 2 days before it ends.
const WINDOW_FROM_H = 36;
const WINDOW_TO_H = 60;

type Due = { id: string; user_id: string; tier: "regular" | "vip"; sport: Sport | null; ends_at: string };

export async function sendPlanReminders() {
  const service = createServiceClient();
  const now = Date.now();
  const { data } = await service
    .from("subscriptions")
    .select("id, user_id, tier, sport, ends_at")
    .eq("revoked", false)
    .is("reminder_sent_at", null)
    .gt("ends_at", new Date(now + WINDOW_FROM_H * 3600_000).toISOString())
    .lte("ends_at", new Date(now + WINDOW_TO_H * 3600_000).toISOString())
    .limit(500);
  const due = (data ?? []) as Due[];
  const result = { due: due.length, sent: 0, renewed: 0, failed: 0 };

  for (const sub of due) {
    const mark = () => service.from("subscriptions").update({ reminder_sent_at: new Date().toISOString() }).eq("id", sub.id);

    // Already renewed: a later plan of the same kind starts when this one ends. No reminder needed.
    let renewal = service.from("subscriptions").select("id").eq("user_id", sub.user_id).eq("tier", sub.tier).eq("revoked", false).gt("ends_at", sub.ends_at).limit(1);
    renewal = sub.sport ? renewal.eq("sport", sub.sport) : renewal.is("sport", null);
    const { data: later } = await renewal;
    if (later?.length) {
      await mark();
      result.renewed++;
      continue;
    }

    const [{ data: profile }, { data: user }] = await Promise.all([
      service.from("profiles").select("full_name, locale, banned").eq("id", sub.user_id).maybeSingle(),
      service.auth.admin.getUserById(sub.user_id),
    ]);
    const email = user.user?.email;
    if (!email || profile?.banned) {
      await mark();
      continue;
    }
    const locale = profile?.locale === "ar" ? "ar" : "en";
    const plan = planLabel({ tier: sub.tier, sport: sub.sport }, getDictionary(locale));
    const renewUrl = `${siteUrl()}/${locale}/subscribe${sub.tier === "vip" ? "?tier=vip" : sub.sport ? `?sport=${sub.sport}` : ""}`;
    // Only marked once Resend accepts it, so a failure is retried on the next daily run.
    if (await sendEmail({ to: email, ...expiryEmail(locale, profile?.full_name ?? "", plan, sub.ends_at, renewUrl) })) {
      await mark();
      result.sent++;
    } else result.failed++;
  }
  return result;
}
