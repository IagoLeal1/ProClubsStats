import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import type { AssistLink } from "@/lib/stats/partnerships";

interface AssistLinksProps {
  clubId: string;
  links: AssistLink[];
  /** Máximo de linhas exibidas. */
  limit?: number;
}

/** "Fulano → Ciclano: N assistências" (somente as confirmadas). */
export function AssistLinks({ clubId, links, limit = 10 }: AssistLinksProps) {
  if (links.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma assistência confirmada ainda.</p>;
  }

  const max = links[0]?.assists ?? 1;
  const profile = (id: string) => `/clubs/${clubId}/players/${id}`;

  return (
    <ul className="space-y-2.5">
      {links.slice(0, limit).map((link) => (
        <li key={`${link.fromId}>${link.toId}`} className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Link href={profile(link.fromId)} className="truncate font-medium hover:underline">
              {link.fromName}
            </Link>
            <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label="para" />
            <Link href={profile(link.toId)} className="truncate font-medium hover:underline">
              {link.toName}
            </Link>
            <span className="ml-auto shrink-0 font-semibold tabular">
              {link.assists} <span className="text-xs font-normal text-muted-foreground">assist.</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-chart-1" style={{ width: `${(link.assists / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
