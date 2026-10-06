import { ImageResponse } from "next/og";

import {
  OG_COLORS,
  OG_FIGURE,
  OG_FONTS,
  OG_KICKER,
  OG_SIZE,
  OgFrame,
  loadImageDataUrl,
  loadOgFonts,
} from "@/components/og/OgFrame";
import { OgPitch } from "@/components/og/OgPitch";
import { formatRating } from "@/lib/format";
import { formatWeekRange, placeLineup } from "@/lib/stats/weeks";

import { loadWeek } from "./load-week";

export const alt = "Time da semana do clube";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ clubId: string; week: string }> }) {
  const { clubId, week: weekId } = await params;
  const { club, week, team } = await loadWeek(clubId, weekId);
  const [crest, fonts] = await Promise.all([loadImageDataUrl(club.crestUrl), loadOgFonts()]);
  const { record } = week;
  const star = team.star;

  return new ImageResponse(
    (
      <OgFrame clubName={club.name} crest={crest}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 440 }}>
            <div style={{ display: "flex", ...OG_KICKER, fontSize: 26, color: OG_COLORS.primary }}>Time da semana</div>
            <div style={{ display: "flex", ...OG_FIGURE, fontSize: 64, marginTop: 6 }}>{formatWeekRange(week.id)}</div>

            {star ? (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
                <div style={{ display: "flex", ...OG_KICKER, fontSize: 20, color: OG_COLORS.muted }}>Craque da semana</div>
                <div style={{ display: "flex", ...OG_FIGURE, fontSize: star.playerName.length > 12 ? 46 : 60, marginTop: 6 }}>
                  {star.playerName}
                </div>
                <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted, marginTop: 6, fontFamily: OG_FONTS.body }}>
                  {`nota ${formatRating(star.averageRating)} em ${star.games} jogos`}
                </div>
              </div>
            ) : null}

            <div style={{ display: "flex", ...OG_FIGURE, fontSize: 48, gap: 16, marginTop: 30 }}>
              <span style={{ color: OG_COLORS.win }}>{`${record.wins}V`}</span>
              <span style={{ color: OG_COLORS.draw }}>{`${record.draws}E`}</span>
              <span style={{ color: OG_COLORS.loss }}>{`${record.losses}D`}</span>
            </div>
          </div>
          <OgPitch
            markers={placeLineup(team.lineup).map(({ line, x, y }) => ({
              key: line.playerId,
              x,
              y,
              label: formatRating(line.averageRating),
              name: line.playerName,
              tone: line.playerId === star?.playerId ? "highlight" : "default",
            }))}
          />
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
