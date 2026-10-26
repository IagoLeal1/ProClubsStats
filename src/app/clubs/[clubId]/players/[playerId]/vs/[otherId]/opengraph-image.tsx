import { ImageResponse } from "next/og";

import {
  OG_COLORS,
  OG_FIGURE,
  OG_KICKER,
  OG_SIZE,
  OgFrame,
  OgStat,
  loadImageDataUrl,
  loadOgFonts,
} from "@/components/og/OgFrame";
import { formatDuelValue } from "@/lib/stats/versus";

import { loadVersus } from "./load-versus";

export const alt = "Duelo entre dois jogadores do clube";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Linhas do duelo que cabem na imagem. */
const PREVIEW_ROWS = ["Gols", "Assistências", "Passes certos", "Desarmes"];

/** Gamertags longas encolhem e, no limite, são cortadas. */
function fitName(name: string): { text: string; fontSize: number } {
  const text = name.length > 16 ? `${name.slice(0, 15)}…` : name;
  return { text: text.toUpperCase(), fontSize: text.length > 12 ? 52 : text.length > 9 ? 68 : 84 };
}

export default async function Image({
  params,
}: {
  params: Promise<{ clubId: string; playerId: string; otherId: string }>;
}) {
  const { clubId, playerId, otherId } = await params;
  const { club, a, b, duel } = await loadVersus(clubId, playerId, otherId, "juntos");
  const [crest, fonts] = await Promise.all([loadImageDataUrl(club.crestUrl), loadOgFonts()]);
  const { score } = duel;
  const color = (own: number, other: number) => (own > other ? OG_COLORS.primary : own < other ? OG_COLORS.muted : OG_COLORS.foreground);
  const nameA = fitName(a.name);
  const nameB = fitName(b.name);
  const rows = duel.rows.filter((row) => PREVIEW_ROWS.includes(row.label));

  return new ImageResponse(
    (
      <OgFrame clubName={club.name} crest={crest}>
        <div style={{ display: "flex", ...OG_KICKER, fontSize: 28, color: OG_COLORS.primary }}>
          {
            {
              juntos: `Duelo · nos ${duel.games.a} jogos juntos`,
              total: "Duelo · todas as partidas salvas",
              geral: "Duelo · média por jogo",
            }[duel.scope]
          }
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginTop: 10 }}>
          <div style={{ display: "flex", flex: 1, ...OG_FIGURE, fontSize: nameA.fontSize, color: color(score.a, score.b) }}>
            {nameA.text}
          </div>
          <div style={{ display: "flex", ...OG_FIGURE, fontSize: 120, gap: 18 }}>
            <span style={{ color: color(score.a, score.b) }}>{String(score.a)}</span>
            <span style={{ color: OG_COLORS.muted }}>×</span>
            <span style={{ color: color(score.b, score.a) }}>{String(score.b)}</span>
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              justifyContent: "flex-end",
              ...OG_FIGURE,
              fontSize: nameB.fontSize,
              color: color(score.b, score.a),
            }}
          >
            {nameB.text}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 28 }}>
          {rows.map((row) => (
            <OgStat
              key={row.label}
              label={row.label}
              value={`${formatDuelValue(row.format, row.a)} × ${formatDuelValue(row.format, row.b)}`}
            />
          ))}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
