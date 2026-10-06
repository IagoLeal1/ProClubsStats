import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Peças das imagens de prévia (Open Graph) que aparecem ao compartilhar um
 * link no WhatsApp. Renderizadas pelo Satori (next/og): só estilos inline e
 * flexbox, então as cores do tema vão em hex aqui.
 */

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_COLORS = {
  background: "#0b0c0e",
  card: "#15171b",
  surface: "#1e2026",
  border: "#2a2d34",
  foreground: "#f2f4f7",
  muted: "#9ba1ac",
  primary: "#22c55e",
  win: "#22c55e",
  draw: "#8e949e",
  loss: "#ff5a4f",
  pitch: "#0f1712",
  pitchStripe: "#121c16",
  pitchLine: "#26352c",
} as const;

/** Família do texto corrido e família condensada dos títulos e números. */
export const OG_FONTS = { body: "Barlow", display: "Barlow Condensed" } as const;

type OgFont = { name: string; data: Buffer; weight: 500 | 600 | 800; style: "normal" | "italic" };

const FONT_FILES = [
  ["Barlow-Medium.ttf", OG_FONTS.body, 500, "normal"],
  ["BarlowCondensed-SemiBold.ttf", OG_FONTS.display, 600, "normal"],
  ["BarlowCondensed-ExtraBoldItalic.ttf", OG_FONTS.display, 800, "italic"],
] as const;

let fontsPromise: Promise<OgFont[]> | undefined;

/** Barlow e Barlow Condensed (assets/fonts, licença SIL OFL), lidas uma vez. */
export function loadOgFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all(
    FONT_FILES.map(async ([file, name, weight, style]) => ({
      name,
      data: await readFile(join(process.cwd(), "assets/fonts", file)),
      weight,
      style,
    })),
  );
  return fontsPromise;
}

/** Estilo dos números grandes: condensado, extra negrito, itálico. */
export const OG_FIGURE = {
  fontFamily: OG_FONTS.display,
  fontWeight: 800,
  fontStyle: "italic",
  lineHeight: 0.9,
} as const;

/** Rótulo pequeno em caixa alta. */
export const OG_KICKER = {
  fontFamily: OG_FONTS.display,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
} as const;

/**
 * Baixa o escudo como data URL. Se a CDN da EA falhar, a prévia sai sem
 * escudo em vez de quebrar.
 */
export async function loadImageDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "image/png";
    const base64 = Buffer.from(await response.arrayBuffer()).toString("base64");
    return `data:${type};base64,${base64}`;
  } catch {
    return null;
  }
}

interface OgFrameProps {
  clubName: string;
  crest: string | null;
  children: React.ReactNode;
}

/** Moldura comum: escudo e nome do clube no topo, marca no rodapé. */
export function OgFrame({ clubName, crest, children }: OgFrameProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
        background: OG_COLORS.background,
        color: OG_COLORS.foreground,
        fontFamily: OG_FONTS.body,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {crest ? (
          // eslint-disable-next-line @next/next/no-img-element -- Satori usa <img> puro
          <img src={crest} width={72} height={72} alt="" style={{ objectFit: "contain" }} />
        ) : null}
        <div style={{ display: "flex", ...OG_KICKER, fontSize: 40, letterSpacing: "0.06em", color: OG_COLORS.foreground }}>
          {clubName}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        {children}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: OG_COLORS.muted }}>
        <div style={{ display: "flex", ...OG_KICKER, fontSize: 22 }}>EA SPORTS FC 27 · Pro Clubs</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", padding: "2px 14px", background: OG_COLORS.primary, color: OG_COLORS.background, ...OG_FIGURE, fontSize: 24 }}>
            FC
          </div>
          <div style={{ display: "flex", ...OG_KICKER, fontSize: 24, color: OG_COLORS.foreground, letterSpacing: "0.1em" }}>
            CLUBS STATS
          </div>
        </div>
      </div>
    </div>
  );
}

/** Nomes longos (gamertags) encolhem e, no limite, são cortados para caber no bloco. */
function fitName(value: string): { text: string; fontSize: number } {
  const text = value.length > 14 ? `${value.slice(0, 13)}…` : value;
  return { text, fontSize: text.length > 10 ? 36 : 44 };
}

/** Bloco "rótulo + valor" usado nas linhas de destaques. */
export function OgStat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  const name = fitName(value);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        padding: "20px 24px",
        background: OG_COLORS.card,
        border: `2px solid ${OG_COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", ...OG_KICKER, fontSize: 20, color: OG_COLORS.muted }}>{label}</div>
      <div style={{ display: "flex", ...OG_FIGURE, fontSize: name.fontSize, marginTop: 6 }}>{name.text}</div>
      {detail ? (
        <div style={{ display: "flex", fontSize: 22, color: OG_COLORS.muted, marginTop: 4 }}>{detail}</div>
      ) : null}
    </div>
  );
}
