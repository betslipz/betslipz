"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import Icon from "./Icon";

// Phone/tablet version of the admin sidebar: one scrollable row of sections.
export default function AdminTabs({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="-mx-4 mb-6 overflow-x-auto border-b border-border px-4 pb-3 lg:hidden">
      <ul className="flex w-max gap-2">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${
                  item.primary ? "bg-accent text-[#04130a]" : active ? "bg-accent/15 text-accent" : "bg-surface text-muted"
                }`}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
                {!!item.badge && (
                  <span className="rounded-full bg-danger px-1.5 text-xs font-bold text-white" dir="ltr">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
