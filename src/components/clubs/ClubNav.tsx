"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { segment: "", label: "Visão geral" },
  { segment: "/players", label: "Jogadores" },
  { segment: "/matches", label: "Partidas" },
  { segment: "/formations", label: "Formações" },
] as const;

export function ClubNav({ clubId }: { clubId: string }) {
  const pathname = usePathname();
  const base = `/clubs/${clubId}`;

  return (
    <nav aria-label="Seções do clube" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex min-w-max gap-1 border-b">
        {ITEMS.map((item) => {
          const href = `${base}${item.segment}`;
          const active = item.segment === "" ? pathname === base : pathname.startsWith(href);
          return (
            <li key={item.segment}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
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
  );
}
