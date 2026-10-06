import { ImageResponse } from "next/og";

import {
  OG_COLORS,
  OG_FIGURE,
  OG_FONTS,
  OG_KICKER,
  OG_SIZE,
  OgFrame,
  OgStat,
  loadImageDataUrl,
  loadOgFonts,
} from "@/components/og/OgFrame";
import { formatRating } from "@/lib/format";
import { formatMonth } from "@/lib/stats/months";

import { loadMonth } from "./load-month";

export const alt = "Prêmios do mês do clube";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ clubId: string; month: string }> }) {
  const { clubId, month: monthId } = await params;
  const { club, month, awards } = await loadMonth(clubId, monthId);
  const [crest, fonts] = await Promise.all([loadImageDataUrl(club.crestUrl), loadOgFonts()]);
  const { goldenBall } = awards;
  const stats = [
    awards.topScorer && { label: "Artilheiro", value: awards.topScorer.playerName, detail: `${awards.topScorer.goals} gols` },
    awards.topAssister && {
      label: "Garçom",
      value: awards.topAssister.playerName,
      detail: `${awards.topAssister.assists} assistências`,
    },
    awards.wall && { label: "Muralha", value: awards.wall.playerName, detail: `${awards.wall.tackles} desarmes` },
    awards.flop && {
      label: "Bagre do mês",
      value: awards.flop.playerName,
      detail: `nota ${formatRating(awards.flop.averageRating)}`,
    },
  ].filter((stat): stat is { label: string; value: string; detail: string } => Boolean(stat));

  return new ImageResponse(
    (
      <OgFrame clubName={club.name} crest={crest}>
        <div style={{ display: "flex", ...OG_KICKER, fontSize: 26, color: OG_COLORS.primary }}>
          {`Prêmios de ${formatMonth(month.id)}`}
        </div>
        {goldenBall ? (
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 10 }}>
            <div style={{ display: "flex", width: 10, height: 104, background: OG_COLORS.primary, transform: "skewX(-14deg)" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", ...OG_KICKER, fontSize: 22, color: OG_COLORS.muted }}>Bola de Ouro</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
                <div style={{ display: "flex", ...OG_FIGURE, fontSize: goldenBall.playerName.length > 12 ? 64 : 84 }}>
                  {goldenBall.playerName}
                </div>
                <div style={{ display: "flex", fontSize: 30, color: OG_COLORS.muted, fontFamily: OG_FONTS.body }}>
                  {`nota ${formatRating(goldenBall.averageRating)} · ${goldenBall.games} jogos`}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 16, marginTop: 28 }}>
          {stats.map((stat) => (
            <OgStat key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} />
          ))}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
