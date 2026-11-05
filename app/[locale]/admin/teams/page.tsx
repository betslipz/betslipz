import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { allTeams } from "@/lib/teams";
import { PREDICTION_SPORTS, isSport, sportEmoji } from "@/lib/sports";
import { searchTeams } from "@/lib/team-images";
import { deleteTeam } from "@/app/actions/admin";
import TeamBadge from "@/components/TeamBadge";
import TeamForm from "@/components/admin/TeamForm";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default async function AdminTeams({ params, searchParams }: PageProps<"/[locale]/admin/teams">) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const sport = isSport(sp.sport) ? sp.sport : "football";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const teams = (await allTeams()).filter((x) => x.sport === sport);
  const shown = q ? searchTeams(teams, q, 200) : teams;
  const tab = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-semibold ${active ? "border-accent bg-accent text-[#04130a]" : "border-border hover:border-muted"}`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">{t.admin.teams}</h1>
      <nav className="flex flex-wrap gap-2">
        {PREDICTION_SPORTS.map((s) => (
          <Link key={s} href={`/${locale}/admin/teams?sport=${s}`} className={tab(s === sport)}>
            {sportEmoji(s)} {t.live.sports[s]}
          </Link>
        ))}
      </nav>

      <TeamForm locale={locale} t={t} sport={sport} />

      <form className="flex gap-2" action={`/${locale}/admin/teams`}>
        <input type="hidden" name="sport" value={sport} />
        <input name="q" defaultValue={q} placeholder={t.admin.search} className="input max-w-sm" />
        <button className="btn btn-ghost border border-border">🔎</button>
      </form>
      <p className="text-sm text-muted">
        {shown.length} / {teams.length}
      </p>

      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((team) => (
          <li key={team.id} className="card flex items-center gap-3 p-3">
            <TeamBadge team={team} name={team.name} size={28} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{team.name}</p>
              <p className="truncate text-xs text-muted" dir="ltr">
                {[team.league, team.country?.toUpperCase()].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <form action={deleteTeam}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="id" value={team.id} />
              <ConfirmButton message={`Delete ${team.name}?`} className="btn btn-ghost px-2 py-1 text-xs text-muted hover:text-danger">
                ✕
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
