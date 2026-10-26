/**
 * Contadores de eventos de cada jogador na partida (match_event_aggregate_0..3:
 * "215:21,216:5,…" = código:quantidade). São totais, sem minuto nem ordem.
 *
 * A EA não documenta os códigos. A tabela vem da pesquisa da comunidade, feita
 * com cerca de 51 mil linhas de partidas do FC 27:
 * https://1erkandogan.github.io/fc27-clubs-api/match-events/
 * Conferida nos nossos jogos em 26/10/2026 (214 = gols e 11 = assistências batem
 * com os campos oficiais). Só viram estatística os códigos confirmados lá; o resto
 * é guardado cru em player_match_events.
 */
export const EA_EVENT_CODES = {
  interceptions: 6,
  /** Pré-assistência: o passe para quem deu a assistência. */
  secondAssists: 115,
} as const;

export type EventCounts = Record<string, number>;

/** Junta os quatro grupos em {código: quantidade}; null se a EA não mandou nenhum. */
export function parseEventCounts(groups: (string | null | undefined)[]): EventCounts | null {
  if (groups.every((group) => group === null || group === undefined)) return null;
  const counts: EventCounts = {};
  for (const group of groups) {
    for (const pair of (group ?? "").split(",")) {
      const [code, value] = pair.split(":");
      const amount = Number(value);
      if (!code || !/^\d+$/.test(code) || !Number.isInteger(amount) || amount < 0) continue;
      counts[code] = (counts[code] ?? 0) + amount;
    }
  }
  return counts;
}

/** Quantidade de um código; null quando a partida não trouxe contadores. */
export function eventCount(counts: EventCounts | null, code: number): number | null {
  return counts === null ? null : (counts[String(code)] ?? 0);
}
