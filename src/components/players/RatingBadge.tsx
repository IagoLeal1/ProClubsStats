import { formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

function ratingTone(rating: number): string {
  if (rating >= 8) return "bg-sky-500/20 text-sky-300";
  if (rating >= 7) return "bg-win/20 text-win";
  if (rating >= 6) return "bg-amber-500/20 text-amber-300";
  return "bg-loss/20 text-loss";
}

/** Nota com cor por faixa (estilo apps de estatística). */
export function RatingBadge({ rating, className }: { rating: number | null; className?: string }) {
  if (rating === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex min-w-9 justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular",
        ratingTone(rating),
        className,
      )}
    >
      {formatRating(rating)}
    </span>
  );
}
