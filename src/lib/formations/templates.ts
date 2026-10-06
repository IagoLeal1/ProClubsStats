import type { PositionGroup } from "@/types/player";

// -----------------------------------------------------------------------------
// Posições
// -----------------------------------------------------------------------------

/** Siglas em português das posições que uma vaga pode ter. */
export const POSITIONS = [
  { id: "GOL", name: "Goleiro", group: "goalkeeper" },
  { id: "ZAG", name: "Zagueiro", group: "defender" },
  { id: "LE", name: "Lateral-esquerdo", group: "defender" },
  { id: "LD", name: "Lateral-direito", group: "defender" },
  { id: "ALE", name: "Ala esquerdo", group: "defender" },
  { id: "ALD", name: "Ala direito", group: "defender" },
  { id: "VOL", name: "Volante", group: "midfielder" },
  { id: "MC", name: "Meio-campo", group: "midfielder" },
  { id: "MEI", name: "Meia ofensivo", group: "midfielder" },
  { id: "ME", name: "Meia esquerda", group: "midfielder" },
  { id: "MD", name: "Meia direita", group: "midfielder" },
  { id: "PE", name: "Ponta esquerda", group: "forward" },
  { id: "PD", name: "Ponta direita", group: "forward" },
  { id: "SA", name: "Segundo atacante", group: "forward" },
  { id: "ATA", name: "Atacante", group: "forward" },
] as const satisfies readonly { id: string; name: string; group: PositionGroup }[];

export type PositionId = (typeof POSITIONS)[number]["id"];

export const POSITION_IDS = POSITIONS.map((position) => position.id) as [PositionId, ...PositionId[]];

/** Setor de uma sigla (null para siglas desconhecidas). */
export function positionGroup(id: string): PositionGroup | null {
  return POSITIONS.find((position) => position.id === id)?.group ?? null;
}

export function positionName(id: string): string {
  return POSITIONS.find((position) => position.id === id)?.name ?? id;
}

/** Limites para as vagas de linha (o goleiro fica fixo no gol). */
export const FIELD_BOUNDS = { minX: 4, maxX: 96, minY: 12, maxY: 94 };

/**
 * Sigla pela região do campo, para quando alguém arrasta a carta: um MC
 * levado para a frente vira MEI, um lateral que sobe vira ala…
 * (x: 0 esquerda → 100 direita; y: 0 próprio gol → 100 gol adversário).
 */
export function positionForSpot(x: number, y: number): PositionId {
  const side = x < 22 ? "left" : x > 78 ? "right" : "center";
  const wide = (left: PositionId, right: PositionId, center: PositionId) =>
    side === "left" ? left : side === "right" ? right : center;

  if (y < 33) return wide("LE", "LD", "ZAG");
  if (y < 45) return wide("ALE", "ALD", "VOL");
  if (y < 58) return wide("ME", "MD", "MC");
  if (y < 66) return wide("ME", "MD", "MEI");
  if (y < 79) return wide("PE", "PD", "SA");
  return wide("PE", "PD", "ATA");
}

// -----------------------------------------------------------------------------
// Esquemas prontos
// -----------------------------------------------------------------------------

/**
 * Uma vaga de um esquema: sigla e posição no campo em % (x: esquerda →
 * direita; y: próprio gol → gol adversário). A vaga 0 é sempre o goleiro.
 */
export interface SlotTemplate {
  position: PositionId;
  group: PositionGroup;
  x: number;
  y: number;
}

const slot = (position: PositionId, x: number, y: number): SlotTemplate => ({
  position,
  group: positionGroup(position) ?? "midfielder",
  x,
  y,
});

const GK = slot("GOL", 50, 7);
const BACK_FOUR = [slot("LE", 14, 28), slot("ZAG", 37, 22), slot("ZAG", 63, 22), slot("LD", 86, 28)];
const BACK_THREE = [slot("ZAG", 25, 23), slot("ZAG", 50, 20), slot("ZAG", 75, 23)];
const BACK_FIVE = [
  slot("ALE", 10, 34),
  slot("ZAG", 30, 23),
  slot("ZAG", 50, 20),
  slot("ZAG", 70, 23),
  slot("ALD", 90, 34),
];
const TWO_STRIKERS = [slot("ATA", 38, 83), slot("ATA", 62, 83)];
const FRONT_THREE = [slot("PE", 16, 76), slot("ATA", 50, 84), slot("PD", 84, 76)];
const WIDE_FOUR = [slot("ME", 14, 52), slot("MC", 38, 47), slot("MC", 62, 47), slot("MD", 86, 52)];

export const FORMATION_TEMPLATES = {
  // Linha de 4
  "4-3-3": [GK, ...BACK_FOUR, slot("MC", 28, 50), slot("VOL", 50, 44), slot("MC", 72, 50), ...FRONT_THREE],
  "4-3-3 (meio em linha)": [GK, ...BACK_FOUR, slot("MC", 25, 50), slot("MC", 50, 48), slot("MC", 75, 50), ...FRONT_THREE],
  "4-3-3 (ofensivo)": [
    GK,
    ...BACK_FOUR,
    slot("MC", 28, 48),
    slot("MEI", 50, 62),
    slot("MC", 72, 48),
    slot("PE", 16, 78),
    slot("ATA", 50, 86),
    slot("PD", 84, 78),
  ],
  "4-3-3 (dois volantes)": [GK, ...BACK_FOUR, slot("VOL", 34, 42), slot("VOL", 66, 42), slot("MC", 50, 55), ...FRONT_THREE],
  "4-3-3 (falso 9)": [
    GK,
    ...BACK_FOUR,
    slot("MC", 28, 52),
    slot("VOL", 50, 42),
    slot("MC", 72, 52),
    slot("PE", 16, 80),
    slot("SA", 50, 74),
    slot("PD", 84, 80),
  ],
  "4-2-3-1": [
    GK,
    ...BACK_FOUR,
    slot("VOL", 36, 42),
    slot("VOL", 64, 42),
    slot("MEI", 20, 65),
    slot("MEI", 50, 63),
    slot("MEI", 80, 65),
    slot("ATA", 50, 85),
  ],
  "4-2-3-1 (abertos)": [
    GK,
    ...BACK_FOUR,
    slot("VOL", 36, 42),
    slot("VOL", 64, 42),
    slot("ME", 14, 60),
    slot("MEI", 50, 63),
    slot("MD", 86, 60),
    slot("ATA", 50, 85),
  ],
  "4-4-2": [GK, ...BACK_FOUR, ...WIDE_FOUR, slot("ATA", 38, 82), slot("ATA", 62, 82)],
  "4-4-2 (dois volantes)": [
    GK,
    ...BACK_FOUR,
    slot("ME", 14, 54),
    slot("VOL", 38, 43),
    slot("VOL", 62, 43),
    slot("MD", 86, 54),
    slot("ATA", 38, 82),
    slot("ATA", 62, 82),
  ],
  "4-4-1-1": [GK, ...BACK_FOUR, ...WIDE_FOUR, slot("SA", 50, 70), slot("ATA", 50, 85)],
  "4-1-4-1": [
    GK,
    ...BACK_FOUR,
    slot("VOL", 50, 40),
    slot("ME", 14, 58),
    slot("MC", 36, 55),
    slot("MC", 64, 55),
    slot("MD", 86, 58),
    slot("ATA", 50, 84),
  ],
  "4-5-1": [
    GK,
    ...BACK_FOUR,
    slot("ME", 12, 54),
    slot("MC", 32, 48),
    slot("MEI", 50, 60),
    slot("MC", 68, 48),
    slot("MD", 88, 54),
    slot("ATA", 50, 84),
  ],
  "4-1-2-1-2": [GK, ...BACK_FOUR, slot("VOL", 50, 39), slot("MC", 28, 52), slot("MC", 72, 52), slot("MEI", 50, 64), ...TWO_STRIKERS],
  "4-1-2-1-2 (aberto)": [
    GK,
    ...BACK_FOUR,
    slot("VOL", 50, 39),
    slot("ME", 16, 55),
    slot("MD", 84, 55),
    slot("MEI", 50, 64),
    ...TWO_STRIKERS,
  ],
  "4-3-1-2": [GK, ...BACK_FOUR, slot("MC", 28, 48), slot("VOL", 50, 43), slot("MC", 72, 48), slot("MEI", 50, 64), ...TWO_STRIKERS],
  "4-3-2-1": [
    GK,
    ...BACK_FOUR,
    slot("MC", 28, 46),
    slot("VOL", 50, 42),
    slot("MC", 72, 46),
    slot("SA", 34, 68),
    slot("SA", 66, 68),
    slot("ATA", 50, 85),
  ],
  "4-2-2-2": [GK, ...BACK_FOUR, slot("VOL", 36, 42), slot("VOL", 64, 42), slot("MEI", 22, 64), slot("MEI", 78, 64), ...TWO_STRIKERS],
  "4-2-4": [
    GK,
    ...BACK_FOUR,
    slot("MC", 36, 46),
    slot("MC", 64, 46),
    slot("PE", 12, 74),
    slot("ATA", 38, 82),
    slot("ATA", 62, 82),
    slot("PD", 88, 74),
  ],
  // Linha de 3
  "3-5-2": [
    GK,
    ...BACK_THREE,
    slot("ME", 12, 55),
    slot("VOL", 36, 42),
    slot("VOL", 64, 42),
    slot("MD", 88, 55),
    slot("MEI", 50, 62),
    ...TWO_STRIKERS,
  ],
  "3-4-3": [
    GK,
    ...BACK_THREE,
    slot("ME", 14, 50),
    slot("MC", 38, 46),
    slot("MC", 62, 46),
    slot("MD", 86, 50),
    slot("PE", 20, 78),
    slot("ATA", 50, 85),
    slot("PD", 80, 78),
  ],
  "3-4-2-1": [
    GK,
    ...BACK_THREE,
    slot("ME", 12, 50),
    slot("MC", 38, 46),
    slot("MC", 62, 46),
    slot("MD", 88, 50),
    slot("SA", 32, 70),
    slot("SA", 68, 70),
    slot("ATA", 50, 85),
  ],
  "3-4-1-2": [
    GK,
    ...BACK_THREE,
    slot("ME", 12, 50),
    slot("MC", 38, 46),
    slot("MC", 62, 46),
    slot("MD", 88, 50),
    slot("MEI", 50, 64),
    ...TWO_STRIKERS,
  ],
  "3-1-4-2": [
    GK,
    ...BACK_THREE,
    slot("VOL", 50, 38),
    slot("ME", 12, 55),
    slot("MC", 36, 52),
    slot("MC", 64, 52),
    slot("MD", 88, 55),
    ...TWO_STRIKERS,
  ],
  // Linha de 5
  "5-3-2": [GK, ...BACK_FIVE, slot("MC", 28, 52), slot("VOL", 50, 47), slot("MC", 72, 52), slot("ATA", 38, 81), slot("ATA", 62, 81)],
  "5-2-1-2": [GK, ...BACK_FIVE, slot("MC", 34, 48), slot("MC", 66, 48), slot("MEI", 50, 63), slot("ATA", 38, 82), slot("ATA", 62, 82)],
  "5-4-1": [
    GK,
    ...BACK_FIVE,
    slot("ME", 16, 58),
    slot("MC", 38, 52),
    slot("MC", 62, 52),
    slot("MD", 84, 58),
    slot("ATA", 50, 84),
  ],
  "5-2-3": [GK, ...BACK_FIVE, slot("MC", 36, 50), slot("MC", 64, 50), slot("PE", 18, 76), slot("ATA", 50, 84), slot("PD", 82, 76)],
} satisfies Record<string, SlotTemplate[]>;

export type FormationType = keyof typeof FORMATION_TEMPLATES;

export const FORMATION_TYPES = Object.keys(FORMATION_TEMPLATES) as [FormationType, ...FormationType[]];

/** Esquemas agrupados pela linha de defesa, para o seletor. */
export const FORMATION_GROUPS: { label: string; types: FormationType[] }[] = [4, 3, 5].map((back) => ({
  label: `Linha de ${back}`,
  types: FORMATION_TYPES.filter((type) => type.startsWith(`${back}-`)),
}));

export const SLOTS_PER_FORMATION = 11;

export function isFormationType(value: string): value is FormationType {
  return value in FORMATION_TEMPLATES;
}

// -----------------------------------------------------------------------------
// Vagas livres (esquema personalizado)
// -----------------------------------------------------------------------------

/** O que importa de uma vaga para comparar e redistribuir: sigla e lugar no campo. */
export interface SlotSpot {
  position: string;
  x: number;
  y: number;
}

/** Setores de linha, de trás para a frente: são as "linhas" que dá para arrastar. */
export const LINE_SECTORS = ["defender", "midfielder", "forward"] as const satisfies readonly PositionGroup[];

export type LineSector = (typeof LINE_SECTORS)[number];

/** Índices das vagas de cada setor (o goleiro, vaga 0, fica de fora). */
export function sectorSlots(spots: SlotSpot[], sector: LineSector): number[] {
  return spots.flatMap((spot, index) => (index !== 0 && positionGroup(spot.position) === sector ? [index] : []));
}

/** Ex.: "4-3-3": quantos na defesa, no meio e no ataque. */
export function shapeOf(spots: SlotSpot[]): string {
  return LINE_SECTORS.map((sector) => sectorSlots(spots, sector).length)
    .filter((count) => count > 0)
    .join("-");
}

const same = (a: number, b: number) => Math.abs(a - b) < 0.01;

export function matchesTemplate(type: FormationType, spots: SlotSpot[]): boolean {
  const template = FORMATION_TEMPLATES[type];
  return (
    spots.length === template.length &&
    spots.every(
      (spot, index) =>
        spot.position === template[index].position && same(spot.x, template[index].x) && same(spot.y, template[index].y),
    )
  );
}

/** Nome do esquema: o pronto, se nada mudou; senão o desenho real + "personalizado". */
export function formationLabel(preset: FormationType | null, spots: SlotSpot[]): string {
  if (preset && matchesTemplate(preset, spots)) return preset;
  return `${shapeOf(spots)} personalizado`;
}

/**
 * Ao trocar de esquema, cada vaga nova herda a vaga antiga do mesmo setor
 * (goleiro, defesa, meio, ataque) mais próxima no campo — assim o atacante
 * continua atacante em vez de herdar pela ordem da lista.
 * Retorna, para cada vaga nova, o índice da vaga antiga correspondente (ou null).
 */
export function matchSlots(from: SlotSpot[], to: SlotSpot[]): (number | null)[] {
  const pairs = to.flatMap((target, newIndex) =>
    from.map((source, oldIndex) => {
      const sameGroup = positionGroup(source.position) === positionGroup(target.position);
      return {
        newIndex,
        oldIndex,
        // Setor diferente custa muito mais que qualquer distância dentro do campo.
        cost: (sameGroup ? 0 : 1000) + Math.hypot(source.x - target.x, source.y - target.y),
      };
    }),
  );
  pairs.sort((a, b) => a.cost - b.cost);

  const result: (number | null)[] = to.map(() => null);
  const usedOld = new Set<number>();
  for (const pair of pairs) {
    if (result[pair.newIndex] !== null || usedOld.has(pair.oldIndex)) continue;
    result[pair.newIndex] = pair.oldIndex;
    usedOld.add(pair.oldIndex);
  }
  return result;
}
