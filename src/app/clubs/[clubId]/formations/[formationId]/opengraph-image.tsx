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

import { loadLineup } from "./load-formation";

export const alt = "Escalação do clube";
export const size = OG_SIZE;
export const contentType = "image/png";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <div style={{ display: "flex", ...OG_KICKER, fontSize: 18, color: OG_COLORS.muted, width: 150 }}>{label}</div>
      <div style={{ display: "flex", ...OG_FIGURE, fontSize: 34 }}>{value}</div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ clubId: string; formationId: string }> }) {
  const { clubId, formationId } = await params;
  const { club, formation, view } = await loadLineup(clubId, formationId);
  const [crest, fonts] = await Promise.all([loadImageDataUrl(club.crestUrl), loadOgFonts()]);
  const { summary } = view;
  const captain = view.cards.find((card) => card.roles.some(({ role }) => role === "captain"));
  const strongest = Math.max(1, ...view.chemistry.map((link) => link.assists));

  return new ImageResponse(
    (
      <OgFrame clubName={club.name} crest={crest}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 440, gap: 10 }}>
            <div style={{ display: "flex", ...OG_KICKER, fontSize: 26, color: OG_COLORS.primary }}>
              {`Escalação · ${formation.formationType}`}
            </div>
            <div style={{ display: "flex", ...OG_FIGURE, fontSize: formation.name.length > 12 ? 52 : 72, marginBottom: 14 }}>
              {formation.name.toUpperCase()}
            </div>
            {summary.averageOverall !== null ? (
              <Fact label="OVR médio" value={String(Math.round(summary.averageOverall))} />
            ) : null}
            {summary.averageSectorRating !== null ? (
              <Fact label="Nota no setor" value={formatRating(summary.averageSectorRating)} />
            ) : null}
            {summary.chemistryAssists > 0 ? (
              <Fact label="Química" value={`${summary.chemistryAssists} assist.`} />
            ) : null}
            {captain?.name ? <Fact label="Capitão" value={captain.name} /> : null}
            <div style={{ display: "flex", fontSize: 20, color: OG_COLORS.muted, fontFamily: OG_FONTS.body, marginTop: 6 }}>
              {`${summary.humans} escalados + ${view.cards.length - summary.humans} da IA`}
            </div>
          </div>
          <OgPitch
            markers={view.cards.map((card) => ({
              key: String(card.slotIndex),
              x: card.x,
              y: card.y,
              label: card.playerId ? String(card.overall ?? card.position) : card.position,
              name: card.name ?? "",
              tone: !card.playerId ? "ghost" : card.playerId === captain?.playerId ? "highlight" : "default",
            }))}
            lines={view.chemistry.map((link) => ({
              key: `${link.a.slotIndex}-${link.b.slotIndex}`,
              from: link.a,
              to: link.b,
              strength: link.assists / strongest,
            }))}
          />
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
