import { cn } from "@/lib/utils";

interface FormationPlayerProps {
  position: string;
  /** null = vaga sem jogador (IA). */
  name: string | null;
  /** Linha extra, ex.: o arquétipo escolhido. */
  detail?: string | null;
  /** 0–100, esquerda → direita. */
  x: number;
  /** 0–100, próprio gol → gol adversário. */
  y: number;
  /** Torna o marcador clicável (montador de formação). */
  onSelect?: () => void;
  selected?: boolean;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Marcador de jogador posicionado no FootballPitch. */
export function FormationPlayer({ position, name, detail, x, y, onSelect, selected }: FormationPlayerProps) {
  const content = (
    <>
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full border-2 text-[10px] font-bold shadow-md transition-transform",
          name ? "border-white/85 bg-background" : "border-white/40 bg-background/60 text-muted-foreground",
          selected && "scale-110 border-primary",
          onSelect && "group-hover:scale-110 group-hover:border-primary",
        )}
      >
        {position}
      </span>
      <span
        className={cn(
          "max-w-full truncate rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium sm:text-xs",
          !name && "text-muted-foreground",
        )}
      >
        {name ?? "IA"}
      </span>
      {detail && (
        <span className="max-w-full truncate rounded bg-primary/90 px-1 text-[9px] font-semibold text-primary-foreground sm:text-[10px]">
          {detail}
        </span>
      )}
    </>
  );

  const className =
    "absolute flex w-[4.5rem] -translate-x-1/2 translate-y-1/2 flex-col items-center gap-0.5 sm:w-20";
  const style = { left: `${clamp(x)}%`, bottom: `${clamp(y)}%` };

  if (!onSelect) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${position}: ${name ?? "IA"}${detail ? `, ${detail}` : ""}. Editar vaga`}
      className={cn(className, "group rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring")}
      style={style}
    >
      {content}
    </button>
  );
}
