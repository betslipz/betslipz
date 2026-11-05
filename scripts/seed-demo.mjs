// Creates demo accounts + sample slips in your Supabase project.
// Usage: npm run seed:demo   (reads .env.local; uses the service-role key, so run it only on your machine)
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const accounts = [
  { email: "admin@example.com", name: "Site Admin", role: "admin", tier: null },
  { email: "vip@example.com", name: "VIP Member", role: "user", tier: "vip" },
  { email: "regular@example.com", name: "Regular Member", role: "user", tier: "regular" },
  { email: "free@example.com", name: "Free User", role: "user", tier: null },
];

const lines = ["# Demo accounts (local testing only; delete these users before going live)", ""];
const ids = {};

const { data: existing } = await db.auth.admin.listUsers({ perPage: 1000 });
for (const a of accounts) {
  const password = randomBytes(9).toString("base64url");
  const found = existing?.users.find((u) => u.email === a.email);
  let id = found?.id;
  if (found) {
    await db.auth.admin.updateUserById(found.id, { password });
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email: a.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: a.name },
    });
    if (error) throw error;
    id = data.user.id;
  }
  ids[a.email] = id;
  await db.from("profiles").update({ role: a.role, full_name: a.name }).eq("id", id);
  if (a.tier) {
    const { data: plan } = await db.from("plans").select("id").eq("tier", a.tier).eq("duration", "month").single();
    await db.from("subscriptions").delete().eq("user_id", id);
    await db.from("subscriptions").insert({
      user_id: id,
      plan_id: plan.id,
      tier: a.tier,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 864e5).toISOString(),
    });
  }
  lines.push(`${a.email.padEnd(22)} ${password}   (${a.role}${a.tier ? `, ${a.tier}` : ""})`);
}

// Sample slips
const admin = ids["admin@example.com"];
const hours = (h) => new Date(Date.now() + h * 3600e3).toISOString();
const days = (d) => new Date(Date.now() - d * 864e5).toISOString();
const samples = [
  {
    tier: "regular", title_en: "Weekend treble", title_ar: "ثلاثية نهاية الأسبوع", confidence: 72, stake_units: 2, status: "pending", publish_at: hours(-2),
    notes_en: "Three home sides in strong form. Kept the odds sensible.", notes_ar: "ثلاثة فرق على أرضها وبمستوى قوي.",
    legs: [
      ["Arsenal vs Brentford", "1X2", "Arsenal", 1.55, 5],
      ["Inter vs Lecce", "1X2", "Inter", 1.40, 6],
      ["PSG vs Nantes", "Over/Under", "Over 2.5", 1.62, 7],
    ],
  },
  {
    tier: "regular", title_en: "Safe double", title_ar: "دبل آمن", confidence: 81, stake_units: 3, status: "pending", publish_at: hours(-1),
    legs: [
      ["Bayern vs Mainz", "Double chance", "1X", 1.12, 4],
      ["Real Madrid vs Getafe", "BTTS", "No", 1.85, 8],
    ],
  },
  {
    tier: "vip", title_en: "VIP value accumulator", title_ar: "مجمّعة VIP بقيمة عالية", confidence: 86, stake_units: 2.5, status: "pending", publish_at: hours(-1),
    notes_en: "Our strongest read of the day: line movement and team news both point the same way.", notes_ar: "أقوى قراءة لدينا اليوم.",
    legs: [
      ["Liverpool vs Wolves", "Handicap", "Liverpool -1", 1.70, 5],
      ["Napoli vs Torino", "1X2", "Napoli", 1.58, 6],
      ["Benfica vs Arouca", "Over/Under", "Over 2.5", 1.50, 7],
      ["Ajax vs Utrecht", "BTTS", "Yes", 1.66, 8],
    ],
  },
  {
    tier: "vip", title_en: "VIP single", confidence: 78, stake_units: 4, status: "pending", publish_at: hours(-0.5),
    legs: [["Barcelona vs Sevilla", "Asian total", "Over 2.75", 1.90, 9]],
  },
  { tier: "regular", title_en: "Midweek double", confidence: 74, stake_units: 2, status: "won", publish_at: days(2), legs: [["Chelsea vs Fulham", "1X2", "Chelsea", 1.60, -48], ["Roma vs Empoli", "1X2", "Roma", 1.45, -47]] },
  { tier: "vip", title_en: "VIP treble", confidence: 83, stake_units: 2, status: "won", publish_at: days(3), legs: [["Man City vs Everton", "1X2", "Man City", 1.30, -70], ["Juventus vs Monza", "BTTS", "No", 1.80, -69], ["Porto vs Vizela", "Over 1.5", "Yes", 1.25, -68]] },
  { tier: "regular", title_en: "Saturday treble", confidence: 66, stake_units: 1, status: "lost", publish_at: days(4), legs: [["Spurs vs Villa", "BTTS", "Yes", 1.62, -94], ["Lyon vs Lens", "1X2", "Lyon", 2.10, -93]] },
  { tier: "regular", title_en: "Banker single", confidence: 80, stake_units: 3, status: "won", publish_at: days(5), legs: [["Dortmund vs Bochum", "1X2", "Dortmund", 1.50, -118]] },
];

await db.from("slips").delete().like("title_en", "%"); // demo reset: removes ALL slips
for (const s of samples) {
  const { legs, ...row } = s;
  const total_odds = Math.round(legs.reduce((a, l) => a * l[3], 1) * 100) / 100;
  const { data, error } = await db.from("slips").insert({ ...row, total_odds, created_by: admin }).select("id").single();
  if (error) throw error;
  if (s.status !== "pending") await db.from("slips").update({ settled_at: s.publish_at }).eq("id", data.id);
  await db.from("slip_legs").insert(
    legs.map(([event, market, pick, odds, kickoffH], i) => ({
      slip_id: data.id, position: i, event, market, pick, odds,
      kickoff_at: hours(kickoffH),
      result: s.status === "pending" ? "pending" : s.status === "lost" && i === 0 ? "lost" : "won",
    })),
  );
}

writeFileSync(".dev-accounts.txt", lines.join("\n") + "\n");
console.log(`✓ Created ${accounts.length} demo accounts and ${samples.length} sample slips.`);
console.log("  Logins and passwords were saved to .dev-accounts.txt (git-ignored).");
