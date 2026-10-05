"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MatchResult } from "@/components/matches/MatchResult";
import { formatInteger, formatPercent, formatRating } from "@/lib/format";
import type { MatchResult as MatchResultValue } from "@/types/match";

export type ChartValueFormat = "rating" | "integer" | "percent";

export interface SeriesChartPoint {
  key: string;
  value: number;
  /** Rótulo curto para o eixo X (só primeiro e último aparecem). */
  axisLabel: string;
  /** Linha logo abaixo do valor no tooltip. */
  title: string;
  /** Linhas extras do tooltip. */
  details?: string[];
  result?: { value: MatchResultValue; label: string };
  /** Clique/Enter abre este link. */
  href?: string;
}

interface SeriesChartProps {
  /** Ordem cronológica: mais antigo → mais recente. */
  points: SeriesChartPoint[];
  /** "line" para tendência (ex.: skill rating); "bar" para valores por partida. */
  variant?: "line" | "bar";
  domain: [number, number];
  tickStep: number;
  valueFormat: ChartValueFormat;
  /** Linha de referência (ex.: média). */
  reference?: { value: number; label: string } | null;
  ariaLabel: string;
}

const HEIGHT = 208;
const MARGIN = { top: 20, right: 64, bottom: 28, left: 40 };
const DOT_RADIUS = 4;

const FORMATTERS: Record<ChartValueFormat, (value: number) => string> = {
  rating: formatRating,
  integer: formatInteger,
  percent: (value) => formatPercent(value),
};

/** Ticks de nota são inteiros: "7" em vez de "7,0". */
const TICK_FORMATTERS: Record<ChartValueFormat, (value: number) => string> = {
  rating: (value) => String(value),
  integer: formatInteger,
  percent: (value) => `${value}%`,
};

function ticks([min, max]: [number, number], step: number): number[] {
  const values: number[] = [];
  for (let value = max; value >= min; value -= step) values.push(value);
  return values;
}

/** Coluna com topo arredondado (4px) e base reta. */
function barPath(x: number, top: number, width: number, baseline: number): string {
  const radius = Math.min(4, width / 2, Math.max(0, baseline - top));
  return [
    `M${x},${baseline}`,
    `V${top + radius}`,
    `Q${x},${top} ${x + radius},${top}`,
    `H${x + width - radius}`,
    `Q${x + width},${top} ${x + width},${top + radius}`,
    `V${baseline}`,
    "Z",
  ].join(" ");
}

/**
 * Gráfico de uma série (linha ou colunas) no padrão de dataviz do projeto:
 * marcas finas, grade discreta, rótulo só no destaque e no último ponto e
 * tooltip por hover, toque ou teclado. A página sempre oferece os mesmos
 * valores em tabela/texto.
 */
export function SeriesChart({
  points,
  variant = "line",
  domain,
  tickStep,
  valueFormat,
  reference,
  ariaLabel,
}: SeriesChartProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const format = FORMATTERS[valueFormat];

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setWidth(element.getBoundingClientRect().width);
    // Mede já na montagem; o observer cuida das mudanças de tamanho depois.
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const [yMin, yMax] = domain;
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = points.length > 0 ? innerWidth / points.length : 0;

  const x = (index: number) => MARGIN.left + band * (index + 0.5);
  const y = (value: number) => MARGIN.top + ((yMax - value) / (yMax - yMin)) * innerHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`)
    .join(" ");

  const lastIndex = points.length - 1;
  const activePoint = active === null ? null : points[active];
  // Colunas: até 24px, sem ocupar a faixa inteira (2px de respiro no mínimo).
  const barWidth = Math.max(4, Math.min(24, band * 0.6, band - 2));
  // Rótulos seletivos: o último ponto e, nas colunas, o maior valor.
  const maxIndex = points.reduce((best, point, index) => (point.value > points[best].value ? index : best), 0);
  const labeled = [...new Set(variant === "bar" ? [maxIndex, lastIndex] : [lastIndex])].filter(
    (index) => index >= 0,
  );

  function open(point: SeriesChartPoint) {
    if (point.href) router.push(point.href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      setActive((current) => Math.min(lastIndex, Math.max(0, (current ?? lastIndex) + delta)));
    } else if (event.key === "Enter" && activePoint) {
      open(activePoint);
    } else {
      return;
    }
    event.preventDefault();
  }

  const tooltipLeft =
    active === null ? 0 : Math.min(Math.max(x(active), 88), Math.max(88, width - 88));

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-label={`${ariaLabel}. Use as setas para navegar pelos pontos.`}
      onKeyDown={handleKeyDown}
      onFocus={() => setActive((current) => current ?? lastIndex)}
      onBlur={() => setActive(null)}
      className="relative rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      style={{ height: HEIGHT }}
    >
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={ariaLabel}
          onPointerLeave={() => setActive(null)}
          className="block select-none"
        >
          {ticks(domain, tickStep).map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[11px] tabular"
              >
                {TICK_FORMATTERS[valueFormat](tick)}
              </text>
            </g>
          ))}

          {reference && (
            <g>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(reference.value)}
                y2={y(reference.value)}
                className="stroke-muted-foreground/60"
                strokeWidth={1}
              />
              <text
                x={width - MARGIN.right + 6}
                y={y(reference.value)}
                dy="0.32em"
                className="fill-muted-foreground text-[11px]"
              >
                {reference.label}
              </text>
            </g>
          )}

          {active !== null && (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              className="stroke-muted-foreground/50"
              strokeWidth={1}
            />
          )}

          {variant === "line" ? (
            <>
              <path
                d={linePath}
                fill="none"
                className="stroke-chart-1"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {points.map((point, index) => (
                <circle
                  key={point.key}
                  cx={x(index)}
                  cy={y(point.value)}
                  r={index === active ? DOT_RADIUS + 1.5 : DOT_RADIUS}
                  className="fill-chart-1 stroke-card"
                  strokeWidth={2}
                />
              ))}
            </>
          ) : (
            points.map((point, index) => (
              <path
                key={point.key}
                d={barPath(x(index) - barWidth / 2, y(point.value), barWidth, y(yMin))}
                className={index === active ? "fill-primary" : "fill-chart-1"}
              />
            ))
          )}

          {active === null &&
            labeled.map((index) => (
              <text
                key={`label-${index}`}
                x={x(index)}
                y={y(points[index].value) - 8}
                textAnchor="middle"
                className="fill-foreground font-display text-[13px] font-bold tabular"
              >
                {format(points[index].value)}
              </text>
            ))}

          {points.length > 1 && (
            <>
              <text
                x={x(0)}
                y={HEIGHT - 8}
                textAnchor="start"
                className="fill-muted-foreground text-[11px] tabular"
              >
                {points[0].axisLabel}
              </text>
              <text
                x={x(lastIndex)}
                y={HEIGHT - 8}
                textAnchor="end"
                className="fill-muted-foreground text-[11px] tabular"
              >
                {points[lastIndex].axisLabel}
              </text>
            </>
          )}

          {/* Áreas de hover: uma faixa inteira por ponto, maior que o próprio ponto */}
          {points.map((point, index) => (
            <rect
              key={`hit-${point.key}`}
              x={x(index) - band / 2}
              y={MARGIN.top}
              width={band}
              height={innerHeight}
              fill="transparent"
              className={point.href ? "cursor-pointer" : undefined}
              onPointerEnter={() => setActive(index)}
              // No toque não há hover: o 1º toque mostra o detalhe, o 2º abre o link.
              onClick={() => (active === index ? open(point) : setActive(index))}
            />
          ))}
        </svg>
      )}

      {activePoint && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-lg bg-popover px-3 py-2 text-xs shadow-lg ring-1 ring-foreground/10"
          style={{ left: tooltipLeft }}
        >
          <p className="text-lg leading-tight font-semibold">{format(activePoint.value)}</p>
          <p className="truncate text-muted-foreground">{activePoint.title}</p>
          {activePoint.result && (
            <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap">
              <MatchResult result={activePoint.result.value} size="sm" className="size-4 text-[10px]" />
              <span className="font-medium">{activePoint.result.label}</span>
            </p>
          )}
          {activePoint.details?.map((detail) => (
            <p key={detail} className="text-muted-foreground">
              {detail}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
