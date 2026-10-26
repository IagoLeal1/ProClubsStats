"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRightIcon } from "lucide-react";

interface PickerPlayer {
  id: string;
  name: string;
}

interface VersusPickerProps {
  clubId: string;
  players: PickerPlayer[];
  aId: string;
  bId: string;
  /** Sufixo da URL que mantém a aba escolhida (ex.: "?escopo=geral"). */
  query: string;
}

/** Troca os jogadores do duelo; cada lado não oferece quem já está do outro. */
export function VersusPicker({ clubId, players, aId, bId, query }: VersusPickerProps) {
  const router = useRouter();
  const href = (a: string, b: string) => `/clubs/${clubId}/players/${a}/vs/${b}${query}`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:gap-3">
      <PlayerSelect
        label="Jogador 1"
        value={aId}
        players={players.filter((player) => player.id !== bId)}
        onChange={(id) => router.push(href(id, bId), { scroll: false })}
      />
      <Link
        href={href(bId, aId)}
        scroll={false}
        aria-label="Inverter os lados"
        title="Inverter os lados"
        className="grid size-11 place-items-center border border-input transition-colors hover:border-primary hover:text-primary"
      >
        <ArrowLeftRightIcon className="size-4" aria-hidden />
      </Link>
      <PlayerSelect
        label="Jogador 2"
        value={bId}
        players={players.filter((player) => player.id !== aId)}
        onChange={(id) => router.push(href(aId, id), { scroll: false })}
      />
    </div>
  );
}

function PlayerSelect({
  label,
  value,
  players,
  onChange,
}: {
  label: string;
  value: string;
  players: PickerPlayer[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="kicker text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full min-w-0 truncate border border-input bg-card px-3 font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </label>
  );
}
