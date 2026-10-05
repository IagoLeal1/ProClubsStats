import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

/** Link de voltar no topo das páginas internas de um clube. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center gap-1 font-display text-base font-bold tracking-[0.08em] text-muted-foreground uppercase hover:text-foreground"
    >
      <ArrowLeftIcon className="size-5" aria-hidden /> {children}
    </Link>
  );
}
