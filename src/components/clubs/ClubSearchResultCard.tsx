import { formatInteger } from "@/lib/format";
import type { ClubSearchResult } from "@/types/club";

import { ClubCrest } from "./ClubCrest";
import { SyncClubButton } from "./SyncClubButton";

export function ClubSearchResultCard({ result }: { result: ClubSearchResult }) {
  const { record } = result;

  return (
    <li className="flex flex-col gap-3 border bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ClubCrest name={result.name} src={result.crestUrl} size={44} />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold uppercase">{result.name}</p>
          <p className="text-xs text-muted-foreground tabular">
            ID {result.eaClubId}
            {record && (
              <>
                {" · "}
                {formatInteger(record.gamesPlayed)} jogos · {record.wins}V {record.draws}E{" "}
                {record.losses}D
              </>
            )}
          </p>
        </div>
      </div>
      <SyncClubButton eaClubId={result.eaClubId} platform={result.platform} mode="open" />
    </li>
  );
}
