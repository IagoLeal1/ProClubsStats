import { formatInteger, formatRelativeTime } from "@/lib/format";
import { PLATFORM_LABELS, type Club } from "@/types/club";

import { ClubCrest } from "./ClubCrest";
import { SyncClubButton } from "./SyncClubButton";

interface ClubHeaderProps {
  club: Club;
  /** Uma sincronização foi disparada em segundo plano nesta visita. */
  autoSyncing?: boolean;
}

export function ClubHeader({ club, autoSyncing = false }: ClubHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-5 sm:gap-x-7">
      <ClubCrest name={club.name} src={club.crestUrl} size={120} className="size-16 sm:size-[120px]" />

      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2.5">
        <p className="kicker text-primary">EA SPORTS FC 27 · Pro Clubs</p>
        <h1 className="figure text-[2.75rem] break-words uppercase sm:text-7xl lg:text-8xl">{club.name}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <span className="rounded-sm border px-2.5 py-1 text-foreground">{PLATFORM_LABELS[club.platform]}</span>
          <span>ID EA {club.eaClubId}</span>
          {club.lastSyncedAt && (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" aria-hidden />
              Atualizado {formatRelativeTime(club.lastSyncedAt)}
            </span>
          )}
          {autoSyncing && <span className="text-primary">Buscando partidas novas…</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 max-sm:w-full sm:items-end">
        {club.skillRating !== null && (
          <div className="flex items-baseline gap-3 sm:flex-col sm:items-end sm:gap-1">
            <span className="kicker text-muted-foreground">Skill rating</span>
            <span className="figure text-5xl text-primary sm:text-7xl">{formatInteger(club.skillRating)}</span>
          </div>
        )}
        <SyncClubButton
          eaClubId={club.eaClubId}
          platform={club.platform}
          mode="refresh"
          className="sm:max-w-64 sm:items-end sm:text-right"
        />
      </div>
    </div>
  );
}
