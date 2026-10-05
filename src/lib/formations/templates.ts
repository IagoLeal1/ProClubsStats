import type { PositionGroup } from "@/types/player";

/**
 * Esquemas táticos disponíveis no montador. Cada vaga tem a sigla da posição,
 * o grupo (para sugerir arquétipos) e a posição no campo em % (x: esquerda →
 * direita; y: próprio gol → gol adversário). A vaga 0 é sempre o goleiro.
 */
export interface SlotTemplate {
  position: string;
  group: PositionGroup;
  x: number;
  y: number;
}

const GK: SlotTemplate = { position: "GOL", group: "goalkeeper", x: 50, y: 7 };

const BACK_FOUR: SlotTemplate[] = [
  { position: "LE", group: "defender", x: 14, y: 28 },
  { position: "ZAG", group: "defender", x: 37, y: 22 },
  { position: "ZAG", group: "defender", x: 63, y: 22 },
  { position: "LD", group: "defender", x: 86, y: 28 },
];

const BACK_THREE: SlotTemplate[] = [
  { position: "ZAG", group: "defender", x: 25, y: 23 },
  { position: "ZAG", group: "defender", x: 50, y: 20 },
  { position: "ZAG", group: "defender", x: 75, y: 23 },
];

const BACK_FIVE: SlotTemplate[] = [
  { position: "ALE", group: "defender", x: 10, y: 34 },
  { position: "ZAG", group: "defender", x: 30, y: 23 },
  { position: "ZAG", group: "defender", x: 50, y: 20 },
  { position: "ZAG", group: "defender", x: 70, y: 23 },
  { position: "ALD", group: "defender", x: 90, y: 34 },
];

const mid = (position: string, x: number, y: number): SlotTemplate => ({
  position,
  group: "midfielder",
  x,
  y,
});
const fwd = (position: string, x: number, y: number): SlotTemplate => ({
  position,
  group: "forward",
  x,
  y,
});

export const FORMATION_TEMPLATES = {
  "4-3-3": [
    GK,
    ...BACK_FOUR,
    mid("MC", 28, 50),
    mid("VOL", 50, 44),
    mid("MC", 72, 50),
    fwd("PE", 16, 76),
    fwd("ATA", 50, 84),
    fwd("PD", 84, 76),
  ],
  "4-2-3-1": [
    GK,
    ...BACK_FOUR,
    mid("VOL", 36, 42),
    mid("VOL", 64, 42),
    mid("MEI", 20, 65),
    mid("MEI", 50, 63),
    mid("MEI", 80, 65),
    fwd("ATA", 50, 85),
  ],
  "4-4-2": [
    GK,
    ...BACK_FOUR,
    mid("ME", 14, 52),
    mid("MC", 38, 47),
    mid("MC", 62, 47),
    mid("MD", 86, 52),
    fwd("ATA", 38, 82),
    fwd("ATA", 62, 82),
  ],
  "4-1-2-1-2": [
    GK,
    ...BACK_FOUR,
    mid("VOL", 50, 39),
    mid("MC", 28, 52),
    mid("MC", 72, 52),
    mid("MEI", 50, 64),
    fwd("ATA", 38, 83),
    fwd("ATA", 62, 83),
  ],
  "4-3-2-1": [
    GK,
    ...BACK_FOUR,
    mid("MC", 28, 46),
    mid("VOL", 50, 42),
    mid("MC", 72, 46),
    fwd("SA", 34, 68),
    fwd("SA", 66, 68),
    fwd("ATA", 50, 85),
  ],
  "3-5-2": [
    GK,
    ...BACK_THREE,
    mid("ME", 12, 55),
    mid("VOL", 36, 42),
    mid("VOL", 64, 42),
    mid("MD", 88, 55),
    mid("MEI", 50, 62),
    fwd("ATA", 38, 83),
    fwd("ATA", 62, 83),
  ],
  "3-4-3": [
    GK,
    ...BACK_THREE,
    mid("ME", 14, 50),
    mid("MC", 38, 46),
    mid("MC", 62, 46),
    mid("MD", 86, 50),
    fwd("PE", 20, 78),
    fwd("ATA", 50, 85),
    fwd("PD", 80, 78),
  ],
  "5-3-2": [
    GK,
    ...BACK_FIVE,
    mid("MC", 28, 52),
    mid("VOL", 50, 47),
    mid("MC", 72, 52),
    fwd("ATA", 38, 81),
    fwd("ATA", 62, 81),
  ],
} satisfies Record<string, SlotTemplate[]>;

export type FormationType = keyof typeof FORMATION_TEMPLATES;

export const FORMATION_TYPES = Object.keys(FORMATION_TEMPLATES) as [
  FormationType,
  ...FormationType[],
];

export const SLOTS_PER_FORMATION = 11;

export function isFormationType(value: string): value is FormationType {
  return value in FORMATION_TEMPLATES;
}

/**
 * Ao trocar de esquema, cada vaga nova herda a vaga antiga do mesmo setor
 * (goleiro, defesa, meio, ataque) mais próxima no campo — assim o atacante
 * continua atacante em vez de herdar pela ordem da lista.
 * Retorna, para cada vaga nova, o índice da vaga antiga correspondente (ou null).
 */
export function matchSlots(from: FormationType, to: FormationType): (number | null)[] {
  const oldSlots = FORMATION_TEMPLATES[from];
  const newSlots = FORMATION_TEMPLATES[to];

  const pairs = newSlots.flatMap((target, newIndex) =>
    oldSlots.map((source, oldIndex) => ({
      newIndex,
      oldIndex,
      // Setor diferente custa muito mais que qualquer distância dentro do campo.
      cost: (source.group === target.group ? 0 : 1000) + Math.hypot(source.x - target.x, source.y - target.y),
    })),
  );
  pairs.sort((a, b) => a.cost - b.cost);

  const result: (number | null)[] = newSlots.map(() => null);
  const usedOld = new Set<number>();
  for (const pair of pairs) {
    if (result[pair.newIndex] !== null || usedOld.has(pair.oldIndex)) continue;
    result[pair.newIndex] = pair.oldIndex;
    usedOld.add(pair.oldIndex);
  }
  return result;
}
