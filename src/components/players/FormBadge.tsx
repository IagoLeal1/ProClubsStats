import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";

import { formatRating } from "@/lib/format";
import type { FormTrend, PlayerForm } from "@/lib/stats/form";
import { cn } from "@/lib/utils";

const TRENDS: Record<FormTrend, { label: string; icon: typeof MinusIcon; className: string }> = {
  up: { label: "Em alta", icon: ArrowUpRightIcon, className: "text-win" },
  down: { label: "Em baixa", icon: ArrowDownRightIcon, className: "text-loss" },
  steady: { label: "Estável", icon: MinusIcon, className: "text-muted-foreground" },
};

/** Ex.: "+0,4", "−0,6", "±0,0". */
export function formatFormDelta(delta: number): string {
  if (delta === 0) return "±0,0";
  return `${delta > 0 ? "+" : "−"}${formatRating(Math.abs(delta))}`;
}

interface FormBadgeProps {
  form: PlayerForm;
  /** Só a seta e a diferença (o rótulo fica para leitores de tela). */
  compact?: boolean;
  className?: string;
}

/** Fase do jogador: seta, rótulo e diferença para a média da temporada. */
export function FormBadge({ form, compact = false, className }: FormBadgeProps) {
  const trend = TRENDS[form.trend];
  const Icon = trend.icon;
  return (
    <span
      title={`Últimos ${form.ratings.length} jogos: média ${formatRating(form.recentAverage)} (temporada ${formatRating(form.baseline)})`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 font-display text-sm font-bold tracking-[0.04em] whitespace-nowrap uppercase tabular",
        trend.className,
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {compact ? <span className="sr-only">{trend.label}</span> : trend.label} {formatFormDelta(form.delta)}
    </span>
  );
}
