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

import { loadX1 } from "./load-x1";

export const alt = "Rei do x1 do clube";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const { club, table } = await loadX1(clubId);
  const [crest, fonts] = await Promise.all([loadImageDataUrl(club.crestUrl), loadOgFonts()]);
  const [king, ...rest] = table.lines;
  const name = king ? (king.playerName.length > 16 ? `${king.playerName.slice(0, 15)}…` : king.playerName) : "";

  return new ImageResponse(
    (
      <OgFrame clubName={club.name} crest={crest}>
        <div style={{ display: "flex", ...OG_KICKER, fontSize: 28, color: OG_COLORS.primary }}>Rei do x1</div>
        {king ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", ...OG_FIGURE, fontSize: name.length > 10 ? 96 : 128, marginTop: 6 }}>
              {name.toUpperCase()}
            </div>
            <div style={{ display: "flex", fontSize: 32, color: OG_COLORS.muted, marginTop: 6 }}>
              {`${king.points} pontos · ${king.wins}V ${king.draws}E ${king.losses}D em ${king.duels} duelos`}
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 28 }}>
              {rest.slice(0, 3).map((line, index) => (
                <OgStat
                  key={line.playerId}
                  label={`${index + 2}º lugar`}
                  value={line.playerName}
                  detail={`${line.points} pts`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 40, color: OG_COLORS.muted }}>Todos contra todos no elenco</div>
        )}
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
