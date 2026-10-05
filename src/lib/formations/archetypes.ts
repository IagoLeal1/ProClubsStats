import type { PositionGroup } from "@/types/player";

/**
 * Arquétipos do Clubs no EA SPORTS FC 27 (13 no total: o Engine saiu e o
 * Disruptor entrou). Nomes mantidos como no jogo. Fontes (outubro/2026):
 * dexerto.com/wikis/ea-fc-27/all-archetypes-explained e
 * proclubshq.com/blog/fc27-archetypes. Se a EA mudar a lista em um
 * patch, basta editar este arquivo.
 */
export const ARCHETYPES = [
  {
    id: "shot-stopper",
    name: "Shot Stopper",
    group: "goalkeeper",
    signature: "Far Reach",
    description: "Goleiro de defesas difíceis, firme no mano a mano.",
  },
  {
    id: "sweeper-keeper",
    name: "Sweeper Keeper",
    group: "goalkeeper",
    signature: "Footwork",
    description: "Joga com os pés e cobre a linha alta; ideal para sair jogando.",
  },
  {
    id: "progressor",
    name: "Progressor",
    group: "defender",
    signature: "Long Ball Pass",
    description: "Zagueiro que sai da linha e inicia o ataque com passes progressivos.",
  },
  {
    id: "boss",
    name: "Boss",
    group: "defender",
    signature: "Bruiser",
    description: "Dono da área: ganha duelos no físico e no corpo a corpo.",
  },
  {
    id: "marauder",
    name: "Marauder",
    group: "defender",
    signature: "Quick Step",
    description: "Defensor muito rápido, segura pontas e apoia o ataque.",
  },
  {
    id: "disruptor",
    name: "Disruptor",
    group: "midfielder",
    signature: "Jockey",
    description: "Volante destruidor: pressão constante e interceptações. Novo no FC 27.",
  },
  {
    id: "recycler",
    name: "Recycler",
    group: "midfielder",
    signature: "Intercept",
    description: "Recupera a bola e faz a equipe rodar com passes simples.",
  },
  {
    id: "maestro",
    name: "Maestro",
    group: "midfielder",
    signature: "Pinged Pass",
    description: "Organizador: técnica, primeiro toque e passe de longe.",
  },
  {
    id: "creator",
    name: "Creator",
    group: "midfielder",
    signature: "Incisive Pass",
    description: "Cria chances com passes decisivos, cruzamentos e bola parada.",
  },
  {
    id: "spark",
    name: "Spark",
    group: "forward",
    signature: "Trickster",
    description: "Ponta driblador e explosivo no um contra um.",
  },
  {
    id: "magician",
    name: "Magician",
    group: "forward",
    signature: "Technical",
    description: "Meia-atacante técnico que decide com drible, passe e chute.",
  },
  {
    id: "finisher",
    name: "Finisher",
    group: "forward",
    signature: "Low Driven Shot",
    description: "Centroavante matador, frio na hora de finalizar.",
  },
  {
    id: "target",
    name: "Target",
    group: "forward",
    signature: "Precision Header",
    description: "Pivô: segura a bola, ganha pelo alto e serve os companheiros.",
  },
] as const satisfies readonly {
  id: string;
  name: string;
  group: PositionGroup;
  signature: string;
  description: string;
}[];

export type Archetype = (typeof ARCHETYPES)[number];
export type ArchetypeId = Archetype["id"];

export const ARCHETYPE_IDS = ARCHETYPES.map((archetype) => archetype.id) as [
  ArchetypeId,
  ...ArchetypeId[],
];

export function findArchetype(id: string | null): Archetype | null {
  return ARCHETYPES.find((archetype) => archetype.id === id) ?? null;
}
