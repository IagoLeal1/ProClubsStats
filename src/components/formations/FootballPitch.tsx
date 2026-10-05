import { cn } from "@/lib/utils";

/**
 * Prancheta tática vertical (proporção 68 × 105). O próprio gol fica embaixo.
 * Os filhos são posicionados em porcentagem (ver FormationPlayer).
 */
export function FootballPitch({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[68/105] w-full overflow-hidden border-2 border-pitch-line bg-pitch",
        className,
      )}
    >
      {/* Faixas do gramado */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_7.14%,var(--pitch-stripe)_7.14%,var(--pitch-stripe)_14.28%)]"
      />
      {/* Linha do meio e círculo central */}
      <div aria-hidden className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-pitch-line" />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 aspect-square w-[27%] -translate-1/2 rounded-full border-2 border-pitch-line"
      />
      {/* Grandes áreas e pequenas áreas */}
      <div aria-hidden className="absolute top-0 left-1/2 h-[15.7%] w-[59.3%] -translate-x-1/2 border-2 border-t-0 border-pitch-line" />
      <div aria-hidden className="absolute top-0 left-1/2 h-[5.2%] w-[26.9%] -translate-x-1/2 border-2 border-t-0 border-pitch-line" />
      <div aria-hidden className="absolute bottom-0 left-1/2 h-[15.7%] w-[59.3%] -translate-x-1/2 border-2 border-b-0 border-pitch-line" />
      <div aria-hidden className="absolute bottom-0 left-1/2 h-[5.2%] w-[26.9%] -translate-x-1/2 border-2 border-b-0 border-pitch-line" />

      {children}
    </div>
  );
}
