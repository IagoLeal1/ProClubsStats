import Link from "next/link";
import { type LucideIcon, SwordsIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface DuelLinkProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** "secondary": contornado, para ficar ao lado de um botão principal. */
  variant?: "primary" | "secondary";
  className?: string;
}

/** Atalho para o x1 (duelo ou Rei do x1). */
export function DuelLink({ href, label, icon: Icon = SwordsIcon, variant = "primary", className }: DuelLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center gap-2 px-5 font-display text-base font-extrabold tracking-[0.08em] uppercase transition-colors",
        variant === "primary"
          ? "clip-slant bg-primary text-primary-foreground hover:opacity-90"
          : "border border-input hover:border-primary hover:text-primary",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
