/** Uma das 11 vagas de uma formação. Sem jogador = IA. */
export interface FormationSlot {
  slotIndex: number;
  /** Sigla da posição (ex.: "ZAG", "MEI"). */
  position: string;
  /** 0–100: posição horizontal no campo (esquerda → direita). */
  x: number;
  /** 0–100: posição vertical no campo (próprio gol → gol adversário). */
  y: number;
  playerId: string | null;
  playerName: string | null;
  /** Id do arquétipo do FC (ver src/lib/formations/archetypes.ts). */
  archetype: string | null;
  /** Ids de atributos priorizados (ver src/lib/formations/attributes.ts). */
  strengths: string[];
  notes: string | null;
}

export interface Formation {
  id: string;
  clubId: string;
  name: string;
  /** Ex.: "4-3-3", "4-2-3-1". */
  formationType: string;
  slots: FormationSlot[];
  createdAt: string;
  updatedAt: string;
}

/** Dados para criar/atualizar uma formação (já validados). */
export interface FormationInput {
  formationId: string | null;
  clubId: string;
  name: string;
  formationType: string;
  slots: Omit<FormationSlot, "playerName">[];
}
