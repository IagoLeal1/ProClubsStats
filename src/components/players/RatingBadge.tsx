import { formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

function ratingTone(rating: number): string {
  if (rating >= 8) return "bg-primary text-primary-foreground";
  if (rating >= 7) return "bg-[#12321f] text-[#86efac]";
  if (rating >= 6) return "bg-[#3a2f12] text-[#fcd34d]";
  return "bg-[#3a1e1c] text-[#ffb4ad]";
}

/** Nota com cor por faixa. */
export function RatingBadge({ rating, className }: { rating: number | null; className?: string }) {
  if (rating === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex min-w-10 justify-center rounded-sm px-1.5 py-0.5 font-display text-[15px] font-bold tabular",
        ratingTone(rating),
        className,
      )}
    >
      {formatRating(rating)}
    </span>
  );
}
