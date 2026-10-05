import { cn } from "@/lib/utils";

export type StatTone = "default" | "win" | "draw" | "loss" | "primary";

const TONE_CLASSES: Record<StatTone, string> = {
  default: "text-foreground",
  win: "text-win",
  draw: "text-draw",
  loss: "text-loss",
  primary: "text-primary",
};

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  /** Selo no canto (ex.: "1º" no elenco). */
  badge?: string;
  tone?: StatTone;
  className?: string;
}

/** Número em destaque: rótulo em caixa alta + valor condensado itálico. */
export function StatCard({ label, value, hint, badge, tone = "default", className }: StatCardProps) {
  return (
    <div className={cn("flex flex-col gap-1 border bg-card px-4 py-3.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="kicker text-muted-foreground">{label}</p>
        {badge && (
          <span
            className={cn(
              "font-display text-sm font-bold",
              badge.startsWith("1º") ? "text-primary" : "text-muted-foreground",
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <p className={cn("figure text-4xl sm:text-[2.75rem]", TONE_CLASSES[tone])}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
