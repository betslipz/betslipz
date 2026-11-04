"use server";

import { redirect } from "next/navigation";
import { isLocale } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { giftState, giftToday, newestOpenRegularSlip } from "@/lib/gift";

// Unlocks today's Regular slip for this account, once. Checked again on the server, so the button can't be replayed.
export async function claimWelcomeGift(formData: FormData) {
  const raw = String(formData.get("locale") ?? "");
  const locale = isLocale(raw) ? raw : "en";
  const session = await getSession();
  if (!session) redirect(`/${locale}/signup`);
  if (giftState(session) !== "available") redirect(`/${locale}/slips`);
  // Keep the gift for another day if there's nothing to show yet.
  const slipId = await newestOpenRegularSlip();
  if (!slipId) redirect(`/${locale}/slips?gift=wait`);

  const service = createServiceClient();
  const { data } = await service.auth.admin.getUserById(session.userId);
  const { error } = await service.auth.admin.updateUserById(session.userId, {
    app_metadata: { ...(data.user?.app_metadata ?? {}), welcome_gift_day: giftToday(), welcome_gift_slip: slipId },
  });
  redirect(`/${locale}/slips${error ? "?gift=error" : ""}`);
}
