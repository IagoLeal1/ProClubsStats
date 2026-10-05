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
          "grid size-[38px] place-items-center rounded-full border-2 font-display text-[13px] font-extrabold transition-transform",
          selected
            ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_rgb(34_197_94/0.3)]"
            : name
              ? "border-foreground bg-background text-foreground"
              : "border-input bg-background/60 text-muted-foreground",
          onSelect && !selected && "group-hover:scale-110 group-hover:border-primary",
        )}
      >
        {position}
      </span>
      <span
        className={cn(
          "max-w-full truncate bg-background px-1.5 py-px text-[11px] font-semibold",
          !name && "text-muted-foreground",
        )}
      >
        {name ?? "IA"}
      </span>
      {detail && (
        <span className="max-w-full truncate bg-primary px-1.5 font-display text-[11px] font-bold tracking-[0.04em] text-primary-foreground">
          {detail}
        </span>
      )}
    </>
  );

  const className =
    "absolute flex w-[4.75rem] -translate-x-1/2 translate-y-1/2 flex-col items-center gap-0.5 sm:w-20";
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
      className={cn(className, "group rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring")}
      style={style}
    >
      {content}
    </button>
  );
}
