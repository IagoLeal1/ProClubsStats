import type { Metadata } from "next";

import { FootballPitch } from "@/components/formations/FootballPitch";
import { FormationPlayer } from "@/components/formations/FormationPlayer";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { listFormationsByClub } from "@/lib/db/formations.repository";
import { formatRelativeTime } from "@/lib/format";

import { loadClub } from "../load-club";

export const metadata: Metadata = { title: "Formações" };

export default async function ClubFormationsPage({ params }: PageProps<"/clubs/[clubId]/formations">) {
  const { clubId } = await params;
  const club = await loadClub(clubId);
  const formations = await listFormationsByClub(club.id);

  return (
    <section className="space-y-6">
      <SectionHeading
        title="Formações do clube"
        description="Escalações salvas do clube. O editor de formações chega em uma próxima versão."
      />

      {formations.length === 0 ? (
        <div className="grid items-center gap-6 rounded-xl border border-dashed p-6 sm:grid-cols-[minmax(0,16rem)_1fr]">
          <FootballPitch className="mx-auto max-w-64 opacity-60" />
          <div className="space-y-2">
            <p className="font-medium">Nenhuma formação cadastrada</p>
            <p className="text-sm text-muted-foreground">
              A estrutura já está pronta no banco (formations e formation_players, com posição x/y de
              cada jogador no campo). Em breve será possível montar e salvar escalações como 4-3-3 ou
              4-2-3-1 diretamente por aqui.
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {formations.map((formation) => (
            <li key={formation.id} className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{formation.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Atualizada {formatRelativeTime(formation.updatedAt)}
                  </p>
                </div>
                <Badge variant="secondary" className="tabular">
                  {formation.formationType}
                </Badge>
              </div>
              <FootballPitch>
                {formation.players.map((player) => (
                  <FormationPlayer
                    key={player.id}
                    name={player.playerName}
                    position={player.position}
                    x={player.x}
                    y={player.y}
                  />
                ))}
              </FootballPitch>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
