import "server-only";

import { OG_COLORS, OG_FIGURE } from "./OgFrame";

/** Campo deitado (próprio gol à esquerda), na proporção 105 × 68. */
export const OG_PITCH = { width: 588, height: 380 };
const MARKER_WIDTH = 140;
const CIRCLE = 48;

export interface OgPitchMarker {
  key: string;
  /** Coordenadas do montador: x 0–100 esquerda → direita; y 0–100 próprio gol → gol adversário. */
  x: number;
  y: number;
  /** Texto do círculo (nota, OVR, sigla…). */
  label: string;
  name: string;
  tone: "highlight" | "default" | "ghost";
}

export interface OgPitchLine {
  key: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** 0–1: espessura e opacidade relativas. */
  strength: number;
}

const shortName = (name: string) => (name.length > 14 ? `${name.slice(0, 13)}…` : name);

/** Campo em pé girado: o "y" do montador vira a horizontal e o "x" a vertical. */
const toPixels = ({ x, y }: { x: number; y: number }) => ({
  left: (y / 100) * OG_PITCH.width,
  top: (x / 100) * OG_PITCH.height,
});

const MARKER_STYLES = {
  highlight: { border: OG_COLORS.primary, background: OG_COLORS.primary, color: OG_COLORS.background },
  default: { border: OG_COLORS.foreground, background: OG_COLORS.background, color: OG_COLORS.foreground },
  ghost: { border: OG_COLORS.border, background: OG_COLORS.pitch, color: OG_COLORS.muted },
} as const;

/** Campo das imagens de prévia, com jogadores e (opcional) linhas de química. */
export function OgPitch({ markers, lines = [] }: { markers: OgPitchMarker[]; lines?: OgPitchLine[] }) {
  const { width, height } = OG_PITCH;
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

      {lines.length > 0 ? (
        <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
          {lines.map(({ key, from, to, strength }) => {
            const a = toPixels(from);
            const b = toPixels(to);
            return (
              <line
                key={key}
                x1={a.left}
                y1={a.top}
                x2={b.left}
                y2={b.top}
                stroke={OG_COLORS.primary}
                strokeOpacity={0.35 + 0.5 * strength}
                strokeWidth={3 + 6 * strength}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      ) : null}

      {markers.map((marker) => {
        const { left, top } = toPixels(marker);
        const style = MARKER_STYLES[marker.tone];
        return (
          <div
            key={marker.key}
            style={{
              position: "absolute",
              left: left - MARKER_WIDTH / 2,
              top: top - CIRCLE / 2,
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
                border: `3px solid ${style.border}`,
                background: style.background,
                color: style.color,
                ...OG_FIGURE,
                fontSize: 22,
              }}
            >
              {marker.label}
            </div>
            {marker.name ? (
              <div style={{ display: "flex", padding: "1px 8px", background: OG_COLORS.background, fontSize: 17 }}>
                {shortName(marker.name)}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
