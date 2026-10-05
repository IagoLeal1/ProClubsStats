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
import { formatRating } from "@/lib/format";
import { formatWeekRange, placeLineup, type TeamOfTheWeek } from "@/lib/stats/weeks";

import { loadWeek } from "./load-week";

export const alt = "Time da semana do clube";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Campo deitado (próprio gol à esquerda), na proporção 105 × 68. */
const PITCH = { width: 588, height: 380 };
const MARKER_WIDTH = 140;
const CIRCLE = 48;

const shortName = (name: string) => (name.length > 14 ? `${name.slice(0, 13)}…` : name);

function OgPitch({ team }: { team: TeamOfTheWeek }) {
  const { width, height } = PITCH;
  const line = `2px solid ${OG_COLORS.pitchLine}`;
  const stripe = width / 14;

  return (
    <div style={{ display: "flex", position: "relative", width, height, background: OG_COLORS.pitch, border: line }}>
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          style={{ position: "absolute", top: 0, bottom: 0, left: (index * 2 + 1) * stripe, width: stripe, background: OG_COLORS.pitchStripe }}
        />
      ))}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: width / 2 - 1, width: 2, background: OG_COLORS.pitchLine }} />
      <div
        style={{ position: "absolute", left: width / 2 - 52, top: height / 2 - 52, width: 104, height: 104, borderRadius: 52, border: line }}
      />
      <div
        style={{ position: "absolute", left: 0, top: height * 0.2, width: width * 0.157, height: height * 0.6, border: line, borderLeft: "none" }}
      />
      <div
        style={{ position: "absolute", right: 0, top: height * 0.2, width: width * 0.157, height: height * 0.6, border: line, borderRight: "none" }}
      />

      {placeLineup(team.lineup).map(({ line: player, x, y }) => {
        const star = player.playerId === team.star?.playerId;
        return (
          <div
            key={player.playerId}
            style={{
              position: "absolute",
              // Campo em pé girado: o "y" do montador vira a horizontal.
              left: (y / 100) * width - MARKER_WIDTH / 2,
              top: (x / 100) * height - CIRCLE / 2,
              width: MARKER_WIDTH,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: CIRCLE,
                height: CIRCLE,
                borderRadius: CIRCLE / 2,
                border: `3px solid ${star ? OG_COLORS.primary : OG_COLORS.foreground}`,
                background: star ? OG_COLORS.primary : OG_COLORS.background,
                color: star ? OG_COLORS.background : OG_COLORS.foreground,
                ...OG_FIGURE,
                fontSize: 22,
              }}
            >
              {formatRating(player.averageRating)}
            </div>
            <div style={{ display: "flex", padding: "1px 8px", background: OG_COLORS.background, fontSize: 17 }}>
              {shortName(player.playerName)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
          <OgPitch team={team} />
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
