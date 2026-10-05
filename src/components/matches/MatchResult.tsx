import { cn } from "@/lib/utils";
import type { MatchResult as MatchResultValue } from "@/types/match";

/** Letras em português: V (vitória), E (empate), D (derrota). */
const RESULT_STYLES: Record<MatchResultValue, { letter: string; label: string; className: string }> = {
  W: { letter: "V", label: "Vitória", className: "bg-win" },
  D: { letter: "E", label: "Empate", className: "bg-draw" },
  L: { letter: "D", label: "Derrota", className: "bg-loss" },
};

interface MatchResultProps {
  result: MatchResultValue;
  size?: "sm" | "md";
  className?: string;
}

/** Selo de resultado em paralelogramo, na cor do resultado. */
export function MatchResult({ result, size = "md", className }: MatchResultProps) {
  const style = RESULT_STYLES[result];
  return (
    <span
      title={style.label}
      aria-label={style.label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-display font-extrabold text-background",
        size === "sm" ? "clip-slant-sm h-6 w-8 text-sm" : "clip-slant h-7 w-10 text-base",
        style.className,
        className,
      )}
    >
      {style.letter}
    </span>
  );
}

export const RESULT_LETTERS: Record<MatchResultValue, string> = { W: "V", D: "E", L: "D" };
