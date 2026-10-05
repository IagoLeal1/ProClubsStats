import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <ClubCrest name={club.name} src={club.crestUrl} size={64} />
        <div className="min-w-0 space-y-1.5">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{club.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{PLATFORM_LABELS[club.platform]}</Badge>
            {club.skillRating !== null && (
              <Badge variant="outline" className="tabular">
                Skill rating <span className="font-semibold text-primary">{formatInteger(club.skillRating)}</span>
              </Badge>
            )}
            <span>ID EA {club.eaClubId}</span>
            {club.lastSyncedAt && <span>Atualizado {formatRelativeTime(club.lastSyncedAt)}</span>}
            {autoSyncing && (
              <span className="text-primary">Buscando partidas novas — recarregue em instantes</span>
            )}
          </div>
        </div>
      </div>
      <SyncClubButton
        eaClubId={club.eaClubId}
        platform={club.platform}
        mode="refresh"
        className="sm:max-w-64 sm:items-end sm:text-right"
      />
    </div>
  );
}
