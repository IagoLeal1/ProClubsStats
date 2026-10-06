/**
 * Tipos do banco no formato gerado pelo Supabase CLI.
 * Mantidos à mão para espelhar `supabase/schema.sql`. Para regenerar a partir
 * do projeto real:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

type Timestamps = {
  created_at: string;
  updated_at: string;
};

type ClubRow = Timestamps & {
  id: string;
  ea_club_id: number;
  platform: string;
  name: string;
  ea_region_id: number | null;
  crest_url: string | null;
  skill_rating: number | null;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  last_synced_at: string | null;
};

type PlayerRow = Timestamps & {
  id: string;
  club_id: string;
  ea_player_id: string | null;
  name: string;
  pro_name: string | null;
  position: string | null;
  ea_position_code: number | null;
  favorite_position: string | null;
  overall: number | null;
  games_played: number;
  goals: number;
  assists: number;
  average_rating: number | null;
  passes_made: number;
  pass_success_rate: number | null;
  tackles_made: number;
  tackle_success_rate: number | null;
  shot_success_rate: number | null;
  win_rate: number | null;
  man_of_the_match: number;
  red_cards: number;
  is_member: boolean;
  last_synced_at: string | null;
};

type MatchRow = Timestamps & {
  id: string;
  club_id: string;
  ea_match_id: string | null;
  fingerprint: string;
  match_type: string;
  played_at: string;
  opponent_ea_club_id: number | null;
  opponent_name: string;
  opponent_crest_url: string | null;
  goals_for: number;
  goals_against: number;
  result: string;
  decided_by_dnf: boolean;
};

type MatchTeamStatsRow = Timestamps & {
  id: string;
  match_id: string;
  side: string;
  goals: number;
  shots: number;
  passes: number;
  passes_completed: number;
  tackles: number;
  tackle_attempts: number;
  saves: number;
  red_cards: number;
};

type PlayerMatchStatsRow = {
  id: string;
  match_id: string;
  player_id: string;
  position: string | null;
  rating: number | null;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  passes_completed: number;
  tackles: number;
  tackle_attempts: number;
  interceptions: number | null;
  yellow_cards: number | null;
  red_cards: number;
  saves: number;
  man_of_the_match: boolean;
  seconds_played: number | null;
  created_at: string;
};

type ClubProgressRow = {
  id: string;
  club_id: string;
  captured_at: string;
  skill_rating: number | null;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
};

type FormationRow = Timestamps & {
  id: string;
  club_id: string;
  name: string;
  formation_type: string;
  captain_id: string | null;
  penalty_taker_id: string | null;
  free_kick_taker_id: string | null;
  corner_taker_id: string | null;
  game_code: string | null;
};

type FormationPlayerRow = Timestamps & {
  id: string;
  formation_id: string;
  player_id: string | null;
  slot_index: number;
  position: string;
  x_position: number;
  y_position: number;
  archetype: string | null;
  strengths: string[];
  notes: string | null;
};

/** Colunas com default no banco ficam opcionais no insert. */
type Insertable<Row, OptionalKeys extends keyof Row> = Omit<Row, OptionalKeys> &
  Partial<Pick<Row, OptionalKeys>>;

type TableDefinition<
  Row,
  OptionalKeys extends keyof Row,
  Relationships extends unknown[] = [],
> = {
  Row: Row;
  Insert: Insertable<Row, OptionalKeys>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

type AutoColumns = "id" | "created_at" | "updated_at";

export type Database = {
  public: {
    Tables: {
      clubs: TableDefinition<
        ClubRow,
        | AutoColumns
        | "ea_region_id"
        | "crest_url"
        | "skill_rating"
        | "games_played"
        | "wins"
        | "draws"
        | "losses"
        | "goals_for"
        | "goals_against"
        | "last_synced_at"
      >;
      players: TableDefinition<
        PlayerRow,
        | AutoColumns
        | "ea_player_id"
        | "pro_name"
        | "position"
        | "ea_position_code"
        | "favorite_position"
        | "overall"
        | "games_played"
        | "goals"
        | "assists"
        | "average_rating"
        | "passes_made"
        | "pass_success_rate"
        | "tackles_made"
        | "tackle_success_rate"
        | "shot_success_rate"
        | "win_rate"
        | "man_of_the_match"
        | "red_cards"
        | "is_member"
        | "last_synced_at",
        [
          {
            foreignKeyName: "players_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ]
      >;
      matches: TableDefinition<
        MatchRow,
        | AutoColumns
        | "ea_match_id"
        | "opponent_ea_club_id"
        | "opponent_crest_url"
        | "decided_by_dnf",
        [
          {
            foreignKeyName: "matches_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ]
      >;
      match_team_stats: TableDefinition<
        MatchTeamStatsRow,
        | AutoColumns
        | "goals"
        | "shots"
        | "passes"
        | "passes_completed"
        | "tackles"
        | "tackle_attempts"
        | "saves"
        | "red_cards",
        [
          {
            foreignKeyName: "match_team_stats_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ]
      >;
      player_match_stats: TableDefinition<
        PlayerMatchStatsRow,
        | "id"
        | "created_at"
        | "position"
        | "rating"
        | "goals"
        | "assists"
        | "shots"
        | "passes"
        | "passes_completed"
        | "tackles"
        | "tackle_attempts"
        | "interceptions"
        | "yellow_cards"
        | "red_cards"
        | "saves"
        | "man_of_the_match"
        | "seconds_played",
        [
          {
            foreignKeyName: "player_match_stats_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_match_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ]
      >;
      club_progress: TableDefinition<
        ClubProgressRow,
        "id" | "captured_at" | "skill_rating",
        [
          {
            foreignKeyName: "club_progress_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ]
      >;
      formations: TableDefinition<
        FormationRow,
        | AutoColumns
        | "captain_id"
        | "penalty_taker_id"
        | "free_kick_taker_id"
        | "corner_taker_id"
        | "game_code",
        [
          {
            foreignKeyName: "formations_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ]
      >;
      formation_players: TableDefinition<
        FormationPlayerRow,
        AutoColumns | "player_id" | "archetype" | "strengths" | "notes",
        [
          {
            foreignKeyName: "formation_players_formation_id_fkey";
            columns: ["formation_id"];
            isOneToOne: false;
            referencedRelation: "formations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "formation_players_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ]
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicTables = Database["public"]["Tables"];

export type TableName = keyof PublicTables;
export type TableRow<T extends TableName> = PublicTables[T]["Row"];
export type TableInsert<T extends TableName> = PublicTables[T]["Insert"];
