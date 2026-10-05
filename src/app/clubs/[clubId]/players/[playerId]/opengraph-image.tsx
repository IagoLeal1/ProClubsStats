import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

import {
  OG_COLORS,
  OG_SIZE,
  OgFrame,
  OgStat,
  loadImageDataUrl,
  loadOgFonts,
} from "@/components/og/OgFrame";
import { getPlayerById } from "@/lib/db/players.repository";
import { formatInteger, formatPercent, formatRating } from "@/lib/format";

import { isValidId, loadClub } from "../../load-club";

export const alt = "Estatísticas do jogador";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ clubId: string; playerId: string }> }) {
  const { clubId, playerId } = await params;
  const club = await loadClub(clubId);
  if (!isValidId(playerId)) notFound();
  const player = await getPlayerById(club.id, playerId);
  if (!player) notFound();

  const [crest, fonts] = await Promise.all([loadImageDataUrl(club.crestUrl), loadOgFonts()]);
  const { stats } = player;
  const subtitle = [player.proName, player.position, player.overall ? `${player.overall} OVR` : null]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <OgFrame clubName={club.name} crest={crest}>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700 }}>{player.name}</div>
        <div style={{ display: "flex", fontSize: 34, color: OG_COLORS.muted, marginBottom: 36 }}>
          {subtitle || "Jogador"}
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <OgStat label="Jogos" value={formatInteger(stats.gamesPlayed)} />
          <OgStat label="Gols" value={formatInteger(stats.goals)} />
          <OgStat label="Assist." value={formatInteger(stats.assists)} />
          <OgStat label="Nota" value={formatRating(stats.averageRating)} />
          <OgStat label="MVPs" value={formatInteger(stats.manOfTheMatch)} />
          <OgStat label="% passe" value={formatPercent(stats.passSuccessRate)} />
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
