import Link from "next/link";

import { FORM_GAMES, type PlayerForm } from "@/lib/stats/form";
import type { Player } from "@/types/player";

import { FormBadge } from "./FormBadge";

interface SquadFormCardProps {
  clubId: string;
  players: Player[];
  forms: Map<string, PlayerForm>;
}

/** Quem está em alta e quem está em baixa no elenco atual. */
export function SquadFormCard({ clubId, players, forms }: SquadFormCardProps) {
  const rows = players.flatMap((player) => {
    const form = forms.get(player.id);
    return player.isMember && form && form.trend !== "steady" ? [{ player, form }] : [];
  });
  // Em alta primeiro (maior alta no topo), depois em baixa (maior queda no fim).
  rows.sort((a, b) => b.form.delta - a.form.delta);
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 border bg-card p-5 sm:p-6">
      <div className="space-y-1">
        <span className="kicker text-primary">Fase do elenco</span>
        <p className="text-sm text-muted-foreground">
          Nota dos últimos {FORM_GAMES} jogos comparada com a média da temporada.
        </p>
      </div>
      <ul className="space-y-2.5">
        {rows.map(({ player, form }) => (
          <li key={player.id} className="flex items-center justify-between gap-3">
            <Link href={`/clubs/${clubId}/players/${player.id}`} className="truncate font-semibold hover:text-primary">
              {player.name}
            </Link>
            <FormBadge form={form} />
          </li>
        ))}
      </ul>
    </section>
  );
}
