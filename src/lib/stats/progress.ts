import type { ClubProgressPoint } from "@/types/club";
import type { PlayerProgressPoint } from "@/types/player";

const DAY_MS = 24 * 60 * 60 * 1000;

/** OVR de um jogador ao longo do tempo (registros do site, a EA só informa o atual). */
export interface OverallTrend {
  playerId: string;
  /** Do mais antigo ao mais recente. */
  points: PlayerProgressPoint[];
  first: PlayerProgressPoint;
  last: PlayerProgressPoint;
  /** Variação desde o primeiro registro. */
  delta: number;
}

/** Agrupa os registros por jogador. `points` deve vir do mais antigo ao mais recente. */
export function overallTrends(points: PlayerProgressPoint[]): Map<string, OverallTrend> {
  const byPlayer = new Map<string, PlayerProgressPoint[]>();
  for (const point of points) {
    const list = byPlayer.get(point.playerId) ?? [];
    list.push(point);
    byPlayer.set(point.playerId, list);
  }

  const trends = new Map<string, OverallTrend>();
  for (const [playerId, list] of byPlayer) {
    const first = list[0];
    const last = list[list.length - 1];
    trends.set(playerId, { playerId, points: list, first, last, delta: last.overall - first.overall });
  }
  return trends;
}

/**
 * Variação do OVR nos últimos `days` dias: do último registro de antes da
 * janela (ou do primeiro, se o registro começou dentro dela) até o atual.
 */
export function overallDeltaSince(trend: OverallTrend, days: number, now = Date.now()): number {
  const cutoff = now - days * DAY_MS;
  const before = trend.points.filter((point) => Date.parse(point.capturedAt) <= cutoff).at(-1);
  return trend.last.overall - (before ?? trend.first).overall;
}

/** Um trecho da trajetória: a divisão e desde quando o clube está nela. */
export interface DivisionStep {
  division: number;
  since: string;
}

/** Trajetória na divisão, juntando registros seguidos da mesma divisão. */
export function divisionTimeline(progress: ClubProgressPoint[]): DivisionStep[] {
  const steps: DivisionStep[] = [];
  for (const point of progress) {
    if (point.division === null) continue;
    if (steps.at(-1)?.division === point.division) continue;
    steps.push({ division: point.division, since: point.capturedAt });
  }
  return steps;
}
