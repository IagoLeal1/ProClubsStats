import type { Player } from "@/types/player";

/** Mínimo de jogos para entrar em rankings de média/porcentagem. */
export const MIN_GAMES_FOR_RATES = 5;

export const goalsAndAssists = (player: Player) =>
  player.stats.goals + player.stats.assists;

// -----------------------------------------------------------------------------
// Ordenação da tabela de jogadores
// -----------------------------------------------------------------------------

export const PLAYER_SORT_KEYS = [
  "name",
  "position",
  "overall",
  "games",
  "goals",
  "assists",
  "goalsAndAssists",
  "rating",
  "passes",
  "passRate",
  "tackles",
] as const;
export type PlayerSortKey = (typeof PLAYER_SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";

type SortValue = number | string | null;

const SORT_VALUES: Record<PlayerSortKey, (player: Player) => SortValue> = {
  name: (player) => player.name.toLowerCase(),
  position: (player) => player.position,
  overall: (player) => player.overall,
  games: (player) => player.stats.gamesPlayed,
  goals: (player) => player.stats.goals,
  assists: (player) => player.stats.assists,
  goalsAndAssists,
  rating: (player) => player.stats.averageRating,
  passes: (player) => player.stats.passesMade,
  passRate: (player) => player.stats.passSuccessRate,
  tackles: (player) => player.stats.tacklesMade,
};

/** Ordena sem mutar; valores nulos sempre ficam no fim. */
export function sortPlayers(
  players: Player[],
  key: PlayerSortKey,
  direction: SortDirection,
): Player[] {
  const valueOf = SORT_VALUES[key];
  const factor = direction === "asc" ? 1 : -1;

  return [...players].sort((a, b) => {
    const valueA = valueOf(a);
    const valueB = valueOf(b);
    if (valueA === valueB) return a.name.localeCompare(b.name);
    if (valueA === null) return 1;
    if (valueB === null) return -1;
    return (valueA < valueB ? -1 : 1) * factor;
  });
}

// -----------------------------------------------------------------------------
// Rankings internos do clube
// -----------------------------------------------------------------------------

export interface RankingEntry {
  player: Player;
  value: number;
}

export type RankingFormat = "integer" | "rating" | "percent";

export interface RankingCategory {
  id: string;
  title: string;
  format: RankingFormat;
  entries: RankingEntry[];
}

interface RankingDefinition {
  id: string;
  title: string;
  format: RankingFormat;
  value: (player: Player) => number | null;
  /** Rankings de média exigem um mínimo de jogos. */
  requiresMinGames?: boolean;
}

const RANKINGS: RankingDefinition[] = [
  { id: "goals", title: "Artilheiro", format: "integer", value: (p) => p.stats.goals },
  { id: "assists", title: "Maior assistente", format: "integer", value: (p) => p.stats.assists },
  { id: "goalsAndAssists", title: "Maior G+A", format: "integer", value: goalsAndAssists },
  {
    id: "rating",
    title: "Melhor nota média",
    format: "rating",
    value: (p) => p.stats.averageRating,
    requiresMinGames: true,
  },
  { id: "games", title: "Mais partidas", format: "integer", value: (p) => p.stats.gamesPlayed },
  { id: "mvp", title: "Mais MVPs", format: "integer", value: (p) => p.stats.manOfTheMatch },
  {
    id: "passing",
    title: "Melhor passador",
    format: "percent",
    value: (p) => p.stats.passSuccessRate,
    requiresMinGames: true,
  },
];

function eligiblePlayers(players: Player[], requiresMinGames: boolean): Player[] {
  const active = players.filter((player) => player.stats.gamesPlayed > 0);
  if (!requiresMinGames) return active;

  const qualified = active.filter((player) => player.stats.gamesPlayed >= MIN_GAMES_FOR_RATES);
  // Clube com poucos jogos: melhor mostrar algo do que um ranking vazio.
  return qualified.length > 0 ? qualified : active;
}

export function buildPlayerRankings(players: Player[], size = 3): RankingCategory[] {
  return RANKINGS.map((definition) => {
    const entries = eligiblePlayers(players, definition.requiresMinGames ?? false)
      .flatMap((player) => {
        const value = definition.value(player);
        return value === null || value <= 0 ? [] : [{ player, value }];
      })
      .sort((a, b) => b.value - a.value || b.player.stats.gamesPlayed - a.player.stats.gamesPlayed)
      .slice(0, size);

    return { id: definition.id, title: definition.title, format: definition.format, entries };
  });
}
