import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/emails";

// Sends the welcome email the first time an account logs in. The "sent" mark lives in app_metadata,
// which only the service role can write; it's set only once Resend accepts the email, so a failed send is retried next login.
export async function sendWelcomeOnce(userId: string) {
  const service = createServiceClient();
  const { data } = await service.auth.admin.getUserById(userId);
  const user = data.user;
  if (!user?.email || user.app_metadata?.welcome_email_sent) return;

  const { data: profile } = await service.from("profiles").select("full_name, locale").eq("id", userId).maybeSingle();
  const locale = profile?.locale === "ar" ? "ar" : "en";
  const sent = await sendEmail({ to: user.email, ...welcomeEmail(locale, profile?.full_name ?? "") });
  if (sent) {
    await service.auth.admin.updateUserById(userId, { app_metadata: { ...user.app_metadata, welcome_email_sent: new Date().toISOString() } });
  }
}
