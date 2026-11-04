"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import Icon from "./Icon";

export default function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (item: NavItem) => {
    if (item.href.includes("#")) return false;
    return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                item.primary
                  ? "mb-2 bg-accent text-[#04130a] hover:brightness-110"
                  : active
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <Icon name={item.icon} />
              <span className="flex-1">{item.label}</span>
              {!!item.badge && (
                <span className="min-w-6 rounded-full bg-danger px-1.5 py-0.5 text-center text-xs font-bold text-white" dir="ltr">
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
