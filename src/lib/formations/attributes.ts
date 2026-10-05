/**
 * Atributos do jogador (os "pontos fortes" que o time quer priorizar em cada
 * posição). É a lista padrão de atributos do EA SPORTS FC, com os nomes em
 * português. Os ids são estáveis e são o que fica salvo no banco.
 */
export const ATTRIBUTE_GROUPS = [
  {
    id: "pace",
    label: "Ritmo",
    attributes: [
      { id: "acceleration", label: "Aceleração" },
      { id: "sprint-speed", label: "Pique" },
    ],
  },
  {
    id: "shooting",
    label: "Finalização",
    attributes: [
      { id: "positioning", label: "Posicionamento" },
      { id: "finishing", label: "Finalização" },
      { id: "shot-power", label: "Força do chute" },
      { id: "long-shots", label: "Chute de longe" },
      { id: "volleys", label: "Voleio" },
      { id: "penalties", label: "Pênaltis" },
    ],
  },
  {
    id: "passing",
    label: "Passe",
    attributes: [
      { id: "vision", label: "Visão de jogo" },
      { id: "crossing", label: "Cruzamento" },
      { id: "free-kick", label: "Cobrança de falta" },
      { id: "short-passing", label: "Passe curto" },
      { id: "long-passing", label: "Passe longo" },
      { id: "curve", label: "Curva" },
    ],
  },
  {
    id: "dribbling",
    label: "Drible",
    attributes: [
      { id: "agility", label: "Agilidade" },
      { id: "balance", label: "Equilíbrio" },
      { id: "reactions", label: "Reação" },
      { id: "ball-control", label: "Controle de bola" },
      { id: "dribbling", label: "Drible" },
      { id: "composure", label: "Compostura" },
    ],
  },
  {
    id: "defending",
    label: "Defesa",
    attributes: [
      { id: "interceptions", label: "Interceptação" },
      { id: "heading", label: "Cabeceio" },
      { id: "defensive-awareness", label: "Consciência defensiva" },
      { id: "standing-tackle", label: "Dividida em pé" },
      { id: "sliding-tackle", label: "Carrinho" },
    ],
  },
  {
    id: "physical",
    label: "Físico",
    attributes: [
      { id: "jumping", label: "Impulsão" },
      { id: "stamina", label: "Fôlego" },
      { id: "strength", label: "Força" },
      { id: "aggression", label: "Agressividade" },
    ],
  },
  {
    id: "goalkeeping",
    label: "Goleiro",
    attributes: [
      { id: "gk-diving", label: "Elasticidade" },
      { id: "gk-handling", label: "Manejo" },
      { id: "gk-kicking", label: "Chute (GOL)" },
      { id: "gk-reflexes", label: "Reflexos" },
      { id: "gk-positioning", label: "Posicionamento (GOL)" },
    ],
  },
] as const;

type AttributeGroup = (typeof ATTRIBUTE_GROUPS)[number];
export type AttributeId = AttributeGroup["attributes"][number]["id"];

const ATTRIBUTE_LABELS = new Map<string, string>(
  ATTRIBUTE_GROUPS.flatMap((group) =>
    group.attributes.map((attribute) => [attribute.id, attribute.label] as const),
  ),
);

export const ATTRIBUTE_IDS = [...ATTRIBUTE_LABELS.keys()] as [AttributeId, ...AttributeId[]];

/** Quantos pontos fortes cada vaga pode ter. */
export const MAX_STRENGTHS = 6;

export function attributeLabel(id: string): string {
  return ATTRIBUTE_LABELS.get(id) ?? id;
}

export function isAttributeId(id: string): id is AttributeId {
  return ATTRIBUTE_LABELS.has(id);
}
