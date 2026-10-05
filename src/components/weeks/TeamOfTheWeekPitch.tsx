import { FootballPitch } from "@/components/formations/FootballPitch";
import { FormationPlayer } from "@/components/formations/FormationPlayer";
import { formatRating } from "@/lib/format";
import { placeLineup, type TeamOfTheWeek } from "@/lib/stats/weeks";

interface TeamOfTheWeekPitchProps {
  clubId: string;
  team: TeamOfTheWeek;
  className?: string;
}

/** Titulares da semana no campo: nota média no círculo, craque em verde. */
export function TeamOfTheWeekPitch({ clubId, team, className }: TeamOfTheWeekPitchProps) {
  return (
    <FootballPitch className={className}>
      {placeLineup(team.lineup).map(({ line, x, y }) => (
        <FormationPlayer
          key={line.playerId}
          position={formatRating(line.averageRating)}
          name={line.playerName}
          x={x}
          y={y}
          highlighted={line.playerId === team.star?.playerId}
          href={`/clubs/${clubId}/players/${line.playerId}`}
        />
      ))}
    </FootballPitch>
  );
}
