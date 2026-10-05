import Link from "next/link";

import { cn } from "@/lib/utils";

interface RecordCardProps {
  label: string;
  value: string;
  /** Contexto do recorde (adversário, período…). */
  detail?: string;
  href?: string;
  tone?: "default" | "win" | "loss";
}

const TONES = { default: "text-foreground", win: "text-win", loss: "text-loss" } as const;

/** Um recorde em destaque; vira link quando aponta para uma partida. */
export function RecordCard({ label, value, detail, href, tone = "default" }: RecordCardProps) {
  const content = (
    <>
      <p className="kicker text-muted-foreground">{label}</p>
      <p className={cn("figure mt-1.5 truncate text-4xl", TONES[tone])}>{value}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </>
  );
  const className = "block border bg-card p-4 sm:p-5";

  return href ? (
    <Link href={href} className={cn(className, "transition-colors hover:bg-surface")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
