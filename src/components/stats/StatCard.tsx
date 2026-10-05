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
  tone?: StatTone;
}

/** Bloco de número em destaque (rótulo, valor e uma linha de contexto). */
export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tracking-tight sm:text-3xl", TONE_CLASSES[tone])}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
