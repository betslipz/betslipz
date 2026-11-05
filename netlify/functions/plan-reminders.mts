// Netlify scheduled function: once a day at 07:00 UTC (09:00–10:00 in Beirut), asks the site to
// email members whose plan ends in about 2 days. The work itself happens in app/api/cron/plan-reminders.

export default async function planReminders() {
  const site = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const res = await fetch(`${site}/api/cron/plan-reminders`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  console.log(`plan reminders: ${res.status} ${await res.text()}`);
}

export const config = { schedule: "0 7 * * *" };
