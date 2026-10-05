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
  background: "#0a0d12",
  card: "#13171e",
  border: "#21272f",
  foreground: "#f0f2f5",
  muted: "#959ca5",
  primary: "#4add8c",
  win: "#3ec873",
  draw: "#979fab",
  loss: "#f4514f",
} as const;

type OgFont = { name: string; data: Buffer; weight: 400 | 700; style: "normal" };

let fontsPromise: Promise<OgFont[]> | undefined;

/** Geist regular + negrito (assets/fonts, licença SIL OFL), lidas uma vez. */
export function loadOgFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all(
    (
      [
        ["Geist-Regular.ttf", 400],
        ["Geist-Bold.ttf", 700],
      ] as const
    ).map(async ([file, weight]) => ({
      name: "Geist",
      data: await readFile(join(process.cwd(), "assets/fonts", file)),
      weight,
      style: "normal" as const,
    })),
  );
  return fontsPromise;
}

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
        fontFamily: "Geist",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {crest ? (
          // eslint-disable-next-line @next/next/no-img-element -- Satori usa <img> puro
          <img src={crest} width={72} height={72} alt="" style={{ objectFit: "contain" }} />
        ) : null}
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{clubName}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        {children}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: OG_COLORS.muted }}>
        <div style={{ display: "flex" }}>EA SPORTS FC 27 · Pro Clubs</div>
        <div style={{ display: "flex", color: OG_COLORS.primary, fontWeight: 700 }}>FC Clubs Stats</div>
      </div>
    </div>
  );
}

/** Bloco "rótulo + valor" usado nas linhas de destaques. */
export function OgStat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "20px 24px",
        borderRadius: 20,
        background: OG_COLORS.card,
        border: `2px solid ${OG_COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 22, color: OG_COLORS.muted }}>{label}</div>
      <div style={{ display: "flex", fontSize: 36, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {detail ? (
        <div style={{ display: "flex", fontSize: 22, color: OG_COLORS.muted, marginTop: 4 }}>{detail}</div>
      ) : null}
    </div>
  );
}
