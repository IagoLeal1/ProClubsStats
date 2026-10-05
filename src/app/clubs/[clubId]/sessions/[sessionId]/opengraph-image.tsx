import { ImageResponse } from "next/og";

import {
  OG_COLORS,
  OG_SIZE,
  OgFrame,
  OgStat,
  loadImageDataUrl,
  loadOgFonts,
} from "@/components/og/OgFrame";
import { formatRating, formatWeekdayDate } from "@/lib/format";
import type { MatchResult } from "@/types/match";

import { loadSession } from "./load-session";

export const alt = "Resumo da noite do clube";
export const size = OG_SIZE;
export const contentType = "image/png";

const RESULT_COLORS: Record<MatchResult, string> = {
  W: OG_COLORS.win,
  D: OG_COLORS.draw,
  L: OG_COLORS.loss,
};

export default async function Image({ params }: { params: Promise<{ clubId: string; sessionId: string }> }) {
  const { clubId, sessionId } = await params;
  const { club, session, summary } = await loadSession(clubId, sessionId);
  const [crest, fonts] = await Promise.all([loadImageDataUrl(club.crestUrl), loadOgFonts()]);
  const { record } = session;

  return new ImageResponse(
    (
      <OgFrame clubName={club.name} crest={crest}>
        <div style={{ display: "flex", fontSize: 30, color: OG_COLORS.primary, fontWeight: 700 }}>
          {`RESUMO DA NOITE · ${formatWeekdayDate(session.startedAt).toUpperCase()}`}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 28, marginTop: 8 }}>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 700, gap: 24 }}>
            <span style={{ color: OG_COLORS.win }}>{`${record.wins}V`}</span>
            <span style={{ color: OG_COLORS.draw }}>{`${record.draws}E`}</span>
            <span style={{ color: OG_COLORS.loss }}>{`${record.losses}D`}</span>
          </div>
          <div style={{ display: "flex", fontSize: 32, color: OG_COLORS.muted }}>
            {`${record.goalsFor} gols pró · ${record.goalsAgainst} contra`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4, marginBottom: 24 }}>
          {session.matches.slice(0, 20).map((match) => (
            <div
              key={match.id}
              style={{ display: "flex", width: 36, height: 12, borderRadius: 6, background: RESULT_COLORS[match.result] }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {summary.mvp ? (
            <OgStat
              label="MVP da noite"
              value={summary.mvp.playerName}
              detail={`nota ${formatRating(summary.mvp.averageRating)}`}
            />
          ) : null}
          {summary.topScorer ? (
            <OgStat label="Artilheiro" value={summary.topScorer.playerName} detail={`${summary.topScorer.goals} gols`} />
          ) : null}
          {summary.topAssister ? (
            <OgStat
              label="Garçom"
              value={summary.topAssister.playerName}
              detail={`${summary.topAssister.assists} assistências`}
            />
          ) : null}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
