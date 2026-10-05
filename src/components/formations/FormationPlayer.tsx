interface FormationPlayerProps {
  name: string;
  position: string;
  /** 0–100, esquerda → direita. */
  x: number;
  /** 0–100, próprio gol → gol adversário. */
  y: number;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Marcador de jogador posicionado no FootballPitch. */
export function FormationPlayer({ name, position, x, y }: FormationPlayerProps) {
  return (
    <div
      className="absolute flex w-16 -translate-x-1/2 translate-y-1/2 flex-col items-center gap-1 sm:w-20"
      style={{ left: `${clamp(x)}%`, bottom: `${clamp(y)}%` }}
    >
      <span className="grid size-8 place-items-center rounded-full border-2 border-white/80 bg-background text-[10px] font-bold shadow-md sm:size-9">
        {position}
      </span>
      <span className="max-w-full truncate rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium sm:text-xs">
        {name}
      </span>
    </div>
  );
}
