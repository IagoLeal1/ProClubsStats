/**
 * Código numérico de posição da EA (campo `proPos`) → sigla.
 *
 * Tabela de IDs de posição usada historicamente pelos jogos FIFA/FC e
 * documentada pela comunidade. Conferida com respostas reais do FC 27 para os
 * códigos 5 (CB, "defender"), 14 (CM, "midfielder") e 25 (ST, "forward").
 * TODO(ea): validar os demais códigos com respostas reais; códigos
 * desconhecidos são exibidos sem sigla.
 */
const PRO_POSITION_LABELS: Readonly<Record<number, string>> = {
  0: "GK",
  1: "SW",
  2: "RWB",
  3: "RB",
  4: "RCB",
  5: "CB",
  6: "LCB",
  7: "LB",
  8: "LWB",
  9: "RDM",
  10: "CDM",
  11: "LDM",
  12: "RM",
  13: "RCM",
  14: "CM",
  15: "LCM",
  16: "LM",
  17: "RAM",
  18: "CAM",
  19: "LAM",
  20: "RF",
  21: "CF",
  22: "LF",
  23: "RW",
  24: "RS",
  25: "ST",
  26: "LS",
  27: "LW",
};

export function positionLabelFromCode(code: number | null): string | null {
  if (code === null) return null;
  return PRO_POSITION_LABELS[code] ?? null;
}
