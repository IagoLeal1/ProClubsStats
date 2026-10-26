import Link from "next/link";
import { SwordsIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Atalho para o duelo entre dois jogadores. */
export function DuelLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "clip-slant inline-flex h-10 items-center gap-2 bg-primary px-5 font-display text-base font-extrabold tracking-[0.08em] text-primary-foreground uppercase transition-opacity hover:opacity-90",
        className,
      )}
    >
      <SwordsIcon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
