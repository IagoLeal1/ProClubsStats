"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  ClipboardListIcon,
  LayoutGridIcon,
  type LucideIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS: { segment: string; label: string; short: string; icon: LucideIcon }[] = [
  { segment: "", label: "Visão geral", short: "Geral", icon: LayoutGridIcon },
  { segment: "/players", label: "Jogadores", short: "Jogadores", icon: UsersIcon },
  { segment: "/matches", label: "Partidas", short: "Partidas", icon: CalendarDaysIcon },
  { segment: "/records", label: "Recordes", short: "Recordes", icon: TrophyIcon },
  { segment: "/formations", label: "Formações", short: "Formações", icon: ClipboardListIcon },
];

/** O resumo da noite fica sob "Partidas". */
const ALIASES: Record<string, string> = { "/sessions": "/matches" };

function useActiveSegment(base: string): string {
  const pathname = usePathname();
  const rest = pathname.slice(base.length);
  const first = rest.match(/^\/[^/]+/)?.[0] ?? "";
  return ALIASES[first] ?? first;
}

/** Abas no computador; barra fixa no rodapé no celular. */
export function ClubNav({ clubId }: { clubId: string }) {
  const base = `/clubs/${clubId}`;
  const active = useActiveSegment(base);

  return (
    <>
      <nav aria-label="Seções do clube" className="no-scrollbar -mx-4 overflow-x-auto px-4 max-md:hidden sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1">
          {ITEMS.map((item) => {
            const isActive = item.segment === active;
            return (
              <li key={item.segment}>
                <Link
                  href={`${base}${item.segment}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "block border-b-[3px] px-4 py-3.5 font-display text-base font-bold tracking-[0.08em] whitespace-nowrap uppercase transition-colors",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="Seções do clube"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-[#101115]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {ITEMS.map((item) => {
            const isActive = item.segment === active;
            const Icon = item.icon;
            return (
              <li key={item.segment}>
                <Link
                  href={`${base}${item.segment}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 font-display text-xs font-semibold tracking-[0.06em] uppercase",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-[22px]" aria-hidden />
                  {item.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
