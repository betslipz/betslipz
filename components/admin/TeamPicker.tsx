"use client";

import { useId, useMemo, useState } from "react";
import { lookupFrom, searchTeams, type Team } from "@/lib/team-images";
import TeamBadge from "@/components/TeamBadge";

// Type a few letters, pick the team or player (crest or flag shown) from the list.
// A name that isn't in the list can still be typed and saved as is.
export default function TeamPicker({
  teams,
  value,
  onChange,
  placeholder,
  required,
  inputRef,
  noMatch,
}: {
  teams: Team[];
  value: string;
  onChange: (name: string) => void;
  placeholder: string;
  required?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
  /** Shown when nothing matches, e.g. "Not in the list: saved as typed". */
  noMatch: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchTeams(teams, value, 8), [teams, value]);
  const selected = useMemo(() => lookupFrom(teams)(value), [teams, value]);

  const choose = (t: Team) => {
    onChange(t.name);
    setOpen(false);
  };

  return (
    <div className="relative min-w-0">
      <div className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center">
        <TeamBadge team={selected} name={value || "?"} size={20} />
      </div>
      <input
        ref={inputRef}
        className="input min-w-0 ps-10"
        placeholder={placeholder}
        value={value}
        required={required}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!open || results.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a - 1 + results.length) % results.length);
          } else if (e.key === "Enter" && value.trim() && !selected) {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && value.trim() !== "" && !selected && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-border bg-surface p-1 shadow-xl">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">{noMatch}</li>
          ) : (
            results.map((t, i) => (
              <li key={t.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(t)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm ${i === active ? "bg-surface-2" : ""}`}
                >
                  <TeamBadge team={t} name={t.name} size={24} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
                  {t.league && <span className="shrink-0 text-xs text-muted">{t.league}</span>}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
