import { Badge } from "@/components/ui/badge";
import { formatInteger } from "@/lib/format";
import type { Player } from "@/types/player";

import { PLAYER_STAT_COLUMNS } from "./player-columns";

const CARD_COLUMNS = PLAYER_STAT_COLUMNS.filter(
  (column) => column.key !== "position" && column.key !== "overall",
);

/** Versão em card da linha da tabela, usada no mobile. */
export function PlayerStatsCard({ player }: { player: Player }) {
  return (
    <article className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{player.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[player.position, player.proName].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!player.isMember && (
            <Badge variant="outline" className="text-[10px]">
              ex-membro
            </Badge>
          )}
          {player.overall !== null && (
            <Badge variant="secondary" className="tabular">
              {formatInteger(player.overall)} OVR
            </Badge>
          )}
        </div>
      </header>
      <dl className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3">
        {CARD_COLUMNS.map((column) => (
          <div key={column.key}>
            <dt className="text-[11px] text-muted-foreground">{column.shortLabel}</dt>
            <dd className="text-sm font-medium tabular">{column.render(player)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
