import "server-only";

import type { TableName } from "@/types/database";

import { getDbReader } from "./client";
import { DatabaseError } from "./errors";

export type TableCounts = Record<TableName, number>;

const TABLES: TableName[] = [
  "clubs",
  "club_progress",
  "players",
  "player_progress",
  "matches",
  "match_team_stats",
  "player_match_stats",
  "player_match_events",
  "formations",
  "formation_players",
];

/** Linhas de cada tabela (contagem exata, sem trazer as linhas). */
export async function countTableRows(): Promise<TableCounts> {
  const db = getDbReader();
  const entries = await Promise.all(
    TABLES.map(async (table) => {
      const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
      if (error) throw new DatabaseError(`contar linhas de ${table}`, error);
      return [table, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(entries) as TableCounts;
}
