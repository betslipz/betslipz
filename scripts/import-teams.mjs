// Imports the teams and players in scripts/teams-catalog.mjs into the "teams" table:
//  * club crests are looked up by name on TheSportsDB (free key), downloaded once and stored in the
//    public "team-logos" bucket, so the site never loads images from anywhere else;
//  * every country flag used is copied from flagcdn.com into the same bucket.
// Safe to run again: teams that already have a crest are skipped, and rows are updated, not duplicated.
// Usage: node scripts/import-teams.mjs   (reads .env.local; uses the service-role key, so run it only on your machine)
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { football, basketball, tennis, darts } from "./teams-catalog.mjs";

config({ path: ".env.local" });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BUCKET = "team-logos";
const API = "https://www.thesportsdb.com/api/v1/json/123";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const publicUrl = (path) => db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const rows = [];
const add = (sport, groups, isPlayer) => {
  for (const [league, list] of Object.entries(groups)) {
    for (const entry of list) {
      const [name, country, search] = entry.split("|");
      rows.push({ sport, name, country: country || null, league, is_player: isPlayer, search: search || name });
    }
  }
};
add("football", football, false);
add("basketball", basketball, false);
add("tennis", tennis, true);
add("darts", darts, true);

async function upload(path, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const type = res.headers.get("content-type") || "image/png";
  const { error } = await db.storage.from(BUCKET).upload(path, Buffer.from(await res.arrayBuffer()), { contentType: type, upsert: true });
  if (error) throw error;
  return publicUrl(path);
}

// 1. Flags.
const flags = [...new Set(rows.map((r) => r.country).filter(Boolean))];
console.log(`Copying ${flags.length} flags…`);
for (const code of flags) {
  try {
    await upload(`flags/${code}.png`, `https://flagcdn.com/w80/${code}.png`);
  } catch (e) {
    console.warn(`  flag ${code} failed: ${e.message}`);
  }
}

// 2. Crests: one name search per club (the free key allows ~30 lookups a minute).
const { data: existing } = await db.from("teams").select("sport, name, logo_url");
const hasLogo = new Set((existing ?? []).filter((t) => t.logo_url).map((t) => `${t.sport}:${t.name}`));
const SPORT = { football: "Soccer", basketball: "Basketball" };
let found = 0;
let missing = [];
for (const r of rows) {
  if (r.is_player || hasLogo.has(`${r.sport}:${r.name}`)) continue;
  await sleep(4000);
  try {
    // When the free key is throttled the API answers with an HTML page: wait a minute and try again.
    let data = null;
    for (let attempt = 0; attempt < 4 && !data; attempt++) {
      const res = await fetch(`${API}/searchteams.php?t=${encodeURIComponent(r.search)}`);
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        console.log(`  throttled at ${r.name}; waiting 60s…`);
        await sleep(60_000);
      }
    }
    if (!data) throw new Error("still throttled");
    const teams = (data.teams ?? []).filter((t) => t.strSport === SPORT[r.sport] && t.strBadge);
    const best = teams.find((t) => norm(t.strTeam) === norm(r.search) || norm(t.strTeam) === norm(r.name)) ?? teams[0];
    if (!best) {
      missing.push(`${r.sport}: ${r.name}`);
      continue;
    }
    r.logo_url = await upload(`logos/${r.sport}/${slug(r.name)}.png`, `${best.strBadge}/tiny`);
    found++;
    process.stdout.write(found % 10 === 0 ? `  ${found} crests…\n` : "");
  } catch (e) {
    missing.push(`${r.sport}: ${r.name} (${e.message})`);
  }
}

// 3. Save everything (keeps an existing crest when none was found this time).
const toSave = rows.map(({ search, ...r }) => r);
for (let i = 0; i < toSave.length; i += 200) {
  const chunk = toSave.slice(i, i + 200).map((r) => (r.logo_url ? r : (({ logo_url, ...rest }) => rest)(r)));
  const { error } = await db.from("teams").upsert(chunk, { onConflict: "sport,name" });
  if (error) throw error;
}

const { count } = await db.from("teams").select("id", { count: "exact", head: true });
console.log(`✓ ${toSave.length} teams and players saved (${count} in the table), ${found} new crests.`);
if (missing.length) console.log(`No crest found, shown with their country flag instead (${missing.length}):\n  ${missing.join("\n  ")}`);
