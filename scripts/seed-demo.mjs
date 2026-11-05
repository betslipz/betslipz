// Creates demo accounts, sample slips and sample predictions in your Supabase project.
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
  { email: "admin@example.com", name: "Site Admin", role: "admin", plan: null },
  { email: "vip@example.com", name: "VIP Member", role: "user", plan: "vip" },
  { email: "regular@example.com", name: "Tennis Member", role: "user", plan: "tennis" },
  { email: "free@example.com", name: "Free User", role: "user", plan: null },
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
  await db.from("subscriptions").delete().eq("user_id", id);
  if (a.plan) {
    // "vip", or the sport of a one-sport plan.
    const vip = a.plan === "vip";
    let q = db.from("plans").select("id").eq("tier", vip ? "vip" : "regular").eq("duration", "month");
    q = vip ? q.is("sport", null) : q.eq("sport", a.plan);
    const { data: plan } = await q.single();
    await db.from("subscriptions").insert({
      user_id: id,
      plan_id: plan.id,
      tier: vip ? "vip" : "regular",
      sport: vip ? null : a.plan,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 864e5).toISOString(),
    });
  }
  lines.push(`${a.email.padEnd(22)} ${password}   (${a.role}${a.plan ? `, ${a.plan}` : ""})`);
}

// Sample slips
const admin = ids["admin@example.com"];
const hours = (h) => new Date(Date.now() + h * 3600e3).toISOString();
const days = (d) => new Date(Date.now() - d * 864e5).toISOString();
const samples = [
  {
    price_usd: 3, title_en: "Weekend treble", title_ar: "ثلاثية نهاية الأسبوع", confidence: 72, stake_units: 2, status: "pending", publish_at: hours(-2),
    notes_en: "Three home sides in strong form. Kept the odds sensible.", notes_ar: "ثلاثة فرق على أرضها وبمستوى قوي.",
    legs: [
      ["Arsenal vs Brentford", "1X2", "Arsenal", 1.55, 5],
      ["Inter vs Lecce", "1X2", "Inter", 1.40, 6],
      ["PSG vs Nantes", "Over/Under", "Over 2.5", 1.62, 7],
    ],
  },
  {
    price_usd: 3, title_en: "Safe double", title_ar: "دبل آمن", confidence: 81, stake_units: 3, status: "pending", publish_at: hours(-1),
    legs: [
      ["Bayern vs Mainz", "Double chance", "1X", 1.12, 4],
      ["Real Madrid vs Getafe", "BTTS", "No", 1.85, 8],
    ],
  },
  {
    price_usd: 5, title_en: "VIP value accumulator", title_ar: "مجمّعة VIP بقيمة عالية", confidence: 86, stake_units: 2.5, status: "pending", publish_at: hours(-1),
    notes_en: "Our strongest read of the day: line movement and team news both point the same way.", notes_ar: "أقوى قراءة لدينا اليوم.",
    legs: [
      ["Liverpool vs Wolves", "Handicap", "Liverpool -1", 1.70, 5],
      ["Napoli vs Torino", "1X2", "Napoli", 1.58, 6],
      ["Benfica vs Arouca", "Over/Under", "Over 2.5", 1.50, 7],
      ["Ajax vs Utrecht", "BTTS", "Yes", 1.66, 8],
    ],
  },
  {
    price_usd: 5, title_en: "VIP single", confidence: 78, stake_units: 4, status: "pending", publish_at: hours(-0.5),
    legs: [["Barcelona vs Sevilla", "Asian total", "Over 2.75", 1.90, 9]],
  },
  { price_usd: 3, title_en: "Midweek double", confidence: 74, stake_units: 2, status: "won", publish_at: days(2), legs: [["Chelsea vs Fulham", "1X2", "Chelsea", 1.60, -48], ["Roma vs Empoli", "1X2", "Roma", 1.45, -47]] },
  { price_usd: 5, title_en: "VIP treble", confidence: 83, stake_units: 2, status: "won", publish_at: days(3), legs: [["Man City vs Everton", "1X2", "Man City", 1.30, -70], ["Juventus vs Monza", "BTTS", "No", 1.80, -69], ["Porto vs Vizela", "Over 1.5", "Yes", 1.25, -68]] },
  { price_usd: 3, title_en: "Saturday treble", confidence: 66, stake_units: 1, status: "lost", publish_at: days(4), legs: [["Spurs vs Villa", "BTTS", "Yes", 1.62, -94], ["Lyon vs Lens", "1X2", "Lyon", 2.10, -93]] },
  { price_usd: 3, title_en: "Banker single", confidence: 80, stake_units: 3, status: "won", publish_at: days(5), legs: [["Dortmund vs Bochum", "1X2", "Dortmund", 1.50, -118]] },
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

// Sample predictions: [sport, competition, event, market, pick, odds, confidence, kick-off in hours, status]
const predictions = [
  ["football", "Premier League", "Arsenal vs Brentford", "1X2", "Arsenal", 1.55, 74, 5, "pending"],
  ["football", "Serie A", "Inter vs Lecce", "Over/Under", "Over 2.5", 1.72, 66, 6, "pending"],
  ["basketball", "NBA", "Celtics vs Knicks", "Moneyline", "Celtics", 1.48, 71, 9, "pending"],
  ["basketball", "EuroLeague", "Real Madrid vs Olympiacos", "Handicap", "Real Madrid -4.5", 1.85, 62, 7, "pending"],
  ["tennis", "ATP Paris", "Sinner vs Rune", "Match winner", "Sinner", 1.35, 80, 4, "pending"],
  ["tennis", "WTA Finals", "Sabalenka vs Gauff", "Total games", "Over 21.5", 1.8, 64, 8, "pending"],
  ["darts", "Grand Slam of Darts", "Littler vs Humphries", "Match winner", "Littler", 1.6, 68, 10, "pending"],
  ["football", "La Liga", "Barcelona vs Sevilla", "BTTS", "Yes", 1.7, 70, -46, "won"],
  ["tennis", "ATP Paris", "Alcaraz vs Fritz", "Match winner", "Alcaraz", 1.4, 77, -30, "won"],
  ["darts", "Premier League Darts", "Van Gerwen vs Price", "Match winner", "Van Gerwen", 1.9, 61, -50, "lost"],
  ["basketball", "NBA", "Lakers vs Suns", "Total points", "Over 224.5", 1.87, 63, -26, "won"],
];
await db.from("predictions").delete().like("event", "%"); // demo reset: removes ALL predictions
for (const [sport, competition, event, market, pick, odds, confidence, kickoffH, status] of predictions) {
  const { data, error } = await db
    .from("predictions")
    .insert({ sport, competition, event, market, pick, odds, confidence, kickoff_at: hours(kickoffH), publish_at: hours(Math.min(kickoffH, 0) - 3), created_by: admin })
    .select("id")
    .single();
  if (error) throw error;
  // Settling through an update stamps settled_at, like the admin page does.
  if (status !== "pending") await db.from("predictions").update({ status }).eq("id", data.id);
}

writeFileSync(".dev-accounts.txt", lines.join("\n") + "\n");
console.log(`✓ Created ${accounts.length} demo accounts, ${samples.length} sample slips and ${predictions.length} predictions.`);
console.log("  Logins and passwords were saved to .dev-accounts.txt (git-ignored).");
