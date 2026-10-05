import { cn } from "@/lib/utils";
import type { MatchResult as MatchResultValue } from "@/types/match";

const RESULT_STYLES: Record<MatchResultValue, { label: string; className: string }> = {
  W: { label: "Vitória", className: "bg-win text-background" },
  D: { label: "Empate", className: "bg-draw text-background" },
  L: { label: "Derrota", className: "bg-loss text-background" },
};

interface MatchResultProps {
  result: MatchResultValue;
  size?: "sm" | "md";
  className?: string;
}

/** Selo W / D / L com a cor do resultado. */
export function MatchResult({ result, size = "md", className }: MatchResultProps) {
  const style = RESULT_STYLES[result];
  return (
    <span
      title={style.label}
      aria-label={style.label}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-md font-bold",
        size === "sm" ? "size-6 text-xs" : "size-8 text-sm",
        style.className,
        className,
      )}
    >
      {result}
    </span>
  );
}
