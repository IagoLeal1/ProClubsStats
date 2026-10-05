import type { Metadata } from "next";
import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { z } from "zod";

import { ClubCrest } from "@/components/clubs/ClubCrest";
import { ClubSearchForm } from "@/components/clubs/ClubSearchForm";
import { ClubSearchResultCard } from "@/components/clubs/ClubSearchResultCard";
import { SyncClubButton } from "@/components/clubs/SyncClubButton";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { searchStoredClubs } from "@/lib/db/clubs.repository";
import { isEAError, searchClubs } from "@/lib/ea";
import { getUserMessage, logServerError } from "@/lib/errors";
import { formatRelativeTime } from "@/lib/format";
import {
  PLATFORM_LABELS,
  PLATFORMS,
  type Club,
  type ClubSearchResult,
  type Platform,
} from "@/types/club";

export const metadata: Metadata = { title: "Pesquisar clube" };

const searchParamsSchema = z.object({
  q: z.string().trim().min(2).max(60).catch(""),
  platform: z.enum(PLATFORMS).catch("crossplay"),
});

/** Primeiro valor quando o parâmetro aparece repetido na URL. */
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = await searchParams;
  const { q, platform } = searchParamsSchema.parse({
    q: first(raw.q) ?? "",
    platform: first(raw.platform),
  });

  return (
    <Container className="space-y-8 pt-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Pesquisar clube</h1>
        <ClubSearchForm variant="hero" defaultQuery={q} defaultPlatform={platform} />
      </div>
      {q ? (
        <SearchResults query={q} platform={platform} />
      ) : (
        <p className="text-sm text-muted-foreground">Digite pelo menos 2 caracteres.</p>
      )}
    </Container>
  );
}

async function SearchResults({ query, platform }: { query: string; platform: Platform }) {
  const [eaOutcome, storedOutcome] = await Promise.allSettled([
    searchClubs(query, platform),
    searchStoredClubs(query, platform),
  ]);

  if (eaOutcome.status === "rejected") logServerError("search:ea", eaOutcome.reason);
  if (storedOutcome.status === "rejected") logServerError("search:db", storedOutcome.reason);

  const eaResults: ClubSearchResult[] = eaOutcome.status === "fulfilled" ? eaOutcome.value : [];
  const storedClubs: Club[] = storedOutcome.status === "fulfilled" ? storedOutcome.value : [];

  const nothingFound =
    eaOutcome.status === "fulfilled" && eaResults.length === 0 && storedClubs.length === 0;
  const eaBlocked =
    eaOutcome.status === "rejected" && isEAError(eaOutcome.reason) && eaOutcome.reason.kind === "blocked";
  const canAddById =
    eaBlocked && /^\d{1,12}$/.test(query) && !storedClubs.some((club) => String(club.eaClubId) === query);

  return (
    <div className="space-y-8">
      {eaBlocked ? (
        <Alert>
          <AlertTitle>Busca por nome indisponível</AlertTitle>
          <AlertDescription>
            A EA não aceita conexões deste servidor, então aqui aparecem só os clubes já
            acompanhados. Para adicionar um clube novo, pesquise pelo ID dele na EA (o número em
            “clubId=” no endereço da página do clube no site da EA).
          </AlertDescription>
        </Alert>
      ) : (
        eaOutcome.status === "rejected" && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível buscar na EA</AlertTitle>
            <AlertDescription>{getUserMessage(eaOutcome.reason)}</AlertDescription>
          </Alert>
        )
      )}

      {canAddById && (
        <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Clube com ID {query}</p>
            <p className="text-xs text-muted-foreground">
              Nosso robô busca os dados na EA e o clube aparece aqui em 1–2 minutos.
            </p>
          </div>
          <SyncClubButton eaClubId={Number(query)} platform={platform} mode="open" label="Adicionar clube" />
        </div>
      )}

      {storedClubs.length > 0 && (
        <section>
          <SectionHeading title="Já acompanhados aqui" description="Abra direto o histórico salvo." />
          <ul className="grid gap-3 sm:grid-cols-2">
            {storedClubs.map((club) => (
              <li key={club.id}>
                <Link
                  href={`/clubs/${club.id}`}
                  className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-accent"
                >
                  <ClubCrest name={club.name} src={club.crestUrl} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{club.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {club.lastSyncedAt ? `Atualizado ${formatRelativeTime(club.lastSyncedAt)}` : "Nunca sincronizado"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {eaResults.length > 0 && (
        <section>
          <SectionHeading
            title={`Resultados na EA · ${PLATFORM_LABELS[platform]}`}
            description="Ao abrir um clube, buscamos os dados atuais na EA e salvamos no histórico."
          />
          <ul className="space-y-2">
            {eaResults.map((result) => (
              <ClubSearchResultCard key={result.eaClubId} result={result} />
            ))}
          </ul>
        </section>
      )}

      {nothingFound && (
        <EmptyState
          icon={SearchXIcon}
          title={`Nenhum clube encontrado para “${query}”`}
          description="A busca da EA usa o nome exato do ranking. Confira a grafia, a plataforma ou tente pelo ID do clube."
        />
      )}
    </div>
  );
}
