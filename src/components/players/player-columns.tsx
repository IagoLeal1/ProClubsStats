import { formatInteger, formatPercent, formatPositionGroupShort } from "@/lib/format";
import { goalsAndAssists, type PlayerSortKey } from "@/lib/stats/player-stats";
import type { Player } from "@/types/player";

import { RatingBadge } from "./RatingBadge";

export interface PlayerColumn {
  key: PlayerSortKey;
  label: string;
  /** Rótulo curto para cabeçalhos estreitos e cards no mobile. */
  shortLabel: string;
  render: (player: Player) => React.ReactNode;
}

/** Colunas da tabela de jogadores, compartilhadas entre tabela e cards. */
export const PLAYER_STAT_COLUMNS: PlayerColumn[] = [
  {
    key: "position",
    label: "Posição",
    shortLabel: "Pos",
    render: (p) => p.position ?? formatPositionGroupShort(p.favoritePosition),
  },
  { key: "overall", label: "Overall", shortLabel: "OVR", render: (p) => formatInteger(p.overall) },
  { key: "games", label: "Jogos", shortLabel: "J", render: (p) => formatInteger(p.stats.gamesPlayed) },
  { key: "goals", label: "Gols", shortLabel: "G", render: (p) => formatInteger(p.stats.goals) },
  { key: "assists", label: "Assistências", shortLabel: "A", render: (p) => formatInteger(p.stats.assists) },
  { key: "goalsAndAssists", label: "G+A", shortLabel: "G+A", render: (p) => formatInteger(goalsAndAssists(p)) },
  {
    key: "rating",
    label: "Nota média",
    shortLabel: "Nota",
    render: (p) => <RatingBadge rating={p.stats.averageRating} />,
  },
  { key: "passes", label: "Passes", shortLabel: "Passes", render: (p) => formatInteger(p.stats.passesMade) },
  {
    key: "passRate",
    label: "% passes certos",
    shortLabel: "% Passe",
    render: (p) => formatPercent(p.stats.passSuccessRate),
  },
  { key: "tackles", label: "Desarmes", shortLabel: "Des", render: (p) => formatInteger(p.stats.tacklesMade) },
];
