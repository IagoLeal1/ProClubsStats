import type { PlayerForm } from "@/lib/stats/form";
import type { AssistLink } from "@/lib/stats/partnerships";
import type { PositionRating, PositionRatings } from "@/lib/stats/positions";
import { FORMATION_ROLES, type Formation } from "@/types/formation";
import type { Player, PositionGroup } from "@/types/player";

import { findArchetype, type Archetype } from "./archetypes";
import { positionGroup } from "./templates";

export type RoleInfo = (typeof FORMATION_ROLES)[number];

/** Uma vaga pronta para a escalação: quem joga, como e com que números. */
export interface LineupCard {
  slotIndex: number;
  /** Sigla da vaga (ex.: "ZAG"). */
  position: string;
  group: PositionGroup | null;
  x: number;
  y: number;
  /** null = IA. */
  playerId: string | null;
  name: string | null;
  proName: string | null;
  overall: number | null;
  archetype: Archetype | null;
  strengths: string[];
  notes: string | null;
  /** Nota média do jogador no setor da vaga, nas partidas salvas. */
  sectorRating: PositionRating | null;
  form: PlayerForm | null;
  roles: RoleInfo[];
}

/** Química: assistências entre dois escalados, somando os dois sentidos. */
export interface ChemistryLink {
  a: LineupCard;
  b: LineupCard;
  assists: number;
  /** Cada sentido com assistência (ex.: A → B: 3). */
  directions: AssistLink[];
}

export interface LineupSummary {
  humans: number;
  averageOverall: number | null;
  /** Média das notas de cada um no setor em que está escalado. */
  averageSectorRating: number | null;
  chemistryAssists: number;
}

export interface LineupView {
  cards: LineupCard[];
  chemistry: ChemistryLink[];
  summary: LineupSummary;
}

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : null;

export function buildLineupView(
  formation: Formation,
  squad: Player[],
  ratings: Map<string, PositionRatings>,
  forms: Map<string, PlayerForm>,
  links: AssistLink[],
): LineupView {
  const players = new Map(squad.map((player) => [player.id, player] as const));

  const cards: LineupCard[] = formation.slots.map((slot) => {
    const player = slot.playerId ? players.get(slot.playerId) : undefined;
    const group = positionGroup(slot.position);
    return {
      slotIndex: slot.slotIndex,
      position: slot.position,
      group,
      x: slot.x,
      y: slot.y,
      playerId: slot.playerId,
      name: slot.playerName,
      proName: player?.proName ?? null,
      overall: player?.overall ?? null,
      archetype: findArchetype(slot.archetype),
      strengths: slot.strengths,
      notes: slot.notes,
      sectorRating: (slot.playerId && group && ratings.get(slot.playerId)?.[group]) || null,
      form: (slot.playerId && forms.get(slot.playerId)) || null,
      roles: FORMATION_ROLES.filter(({ role }) => slot.playerId !== null && formation.roles[role] === slot.playerId),
    };
  });

  const humans = cards.filter((card) => card.playerId !== null);
  const chemistry: ChemistryLink[] = [];
  for (const [index, a] of humans.entries()) {
    for (const b of humans.slice(index + 1)) {
      const directions = links.filter(
        (link) =>
          (link.fromId === a.playerId && link.toId === b.playerId) ||
          (link.fromId === b.playerId && link.toId === a.playerId),
      );
      const assists = directions.reduce((total, link) => total + link.assists, 0);
      if (assists > 0) chemistry.push({ a, b, assists, directions });
    }
  }
  chemistry.sort((first, second) => second.assists - first.assists);

  return {
    cards,
    chemistry,
    summary: {
      humans: humans.length,
      averageOverall: average(humans.flatMap((card) => (card.overall === null ? [] : [card.overall]))),
      averageSectorRating: average(humans.flatMap((card) => (card.sectorRating ? [card.sectorRating.averageRating] : []))),
      chemistryAssists: chemistry.reduce((total, link) => total + link.assists, 0),
    },
  };
}
