// TEMPORÁRIO — diagnóstico do bloqueio da EA na Vercel. Remover após o teste.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const URL_EA =
  "https://proclubs.ea.com/api/fc/allTimeLeaderboard/search?platform=common-gen5&clubName=Clube%20Prognum";

const HEADER_SETS: Record<string, HeadersInit> = {
  atual: {
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    Referer: "https://www.ea.com/",
  },
  minimo: { Accept: "application/json" },
};

export async function GET() {
  const results: Record<string, unknown> = {
    node: process.version,
    region: process.env.VERCEL_REGION ?? null,
  };
  for (const [name, headers] of Object.entries(HEADER_SETS)) {
    try {
      const response = await fetch(URL_EA, { headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
      const body = await response.text();
      results[name] = { status: response.status, server: response.headers.get("server"), body: body.slice(0, 120) };
    } catch (error) {
      results[name] = { error: error instanceof Error ? error.message : String(error) };
    }
  }
  return NextResponse.json(results);
}
