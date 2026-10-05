export interface FormationPlayer {
  id: string;
  playerId: string;
  playerName: string;
  position: string;
  /** 0–100: posição horizontal no campo (esquerda → direita). */
  x: number;
  /** 0–100: posição vertical no campo (próprio gol → gol adversário). */
  y: number;
}

export interface Formation {
  id: string;
  clubId: string;
  name: string;
  /** Ex.: "4-3-3", "4-2-3-1". */
  formationType: string;
  players: FormationPlayer[];
  createdAt: string;
  updatedAt: string;
}
