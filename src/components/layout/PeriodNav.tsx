import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const linkClass =
  "inline-flex h-11 items-center gap-1.5 border border-input px-3.5 font-display text-base font-bold tracking-[0.06em] uppercase transition-colors hover:bg-surface";

interface PeriodNavProps {
  /** Ex.: "Outras semanas". */
  label: string;
  previousHref: string | null;
  nextHref: string | null;
}

/** Setas para o período anterior e o próximo que tiveram jogos. */
export function PeriodNav({ label, previousHref, nextHref }: PeriodNavProps) {
  const items = [
    { href: previousHref, text: "Anterior", icon: ArrowLeftIcon, before: true },
    { href: nextHref, text: "Próximo", icon: ArrowRightIcon, before: false },
  ];
  return (
    <nav aria-label={label} className="flex gap-2">
      {items.map(({ href, text, icon: Icon, before }) => {
        const content = (
          <>
            {before && <Icon className="size-4" aria-hidden />}
            {text}
            {!before && <Icon className="size-4" aria-hidden />}
          </>
        );
        return href ? (
          <Link key={text} href={href} className={linkClass}>
            {content}
          </Link>
        ) : (
          <span key={text} aria-disabled className={cn(linkClass, "pointer-events-none opacity-40")}>
            {content}
          </span>
        );
      })}
    </nav>
  );
}
