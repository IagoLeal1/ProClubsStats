"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MatchResult } from "@/components/matches/MatchResult";
import { formatInteger, formatRating } from "@/lib/format";
import type { MatchResult as MatchResultValue } from "@/types/match";

export type ChartValueFormat = "rating" | "integer";

export interface LineChartPoint {
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

interface LineChartProps {
  /** Ordem cronológica: mais antigo → mais recente. */
  points: LineChartPoint[];
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
};

/** Ticks de nota são inteiros: "7" em vez de "7,0". */
const TICK_FORMATTERS: Record<ChartValueFormat, (value: number) => string> = {
  rating: (value) => String(value),
  integer: formatInteger,
};

function ticks([min, max]: [number, number], step: number): number[] {
  const values: number[] = [];
  for (let value = max; value >= min; value -= step) values.push(value);
  return values;
}

/**
 * Gráfico de linha com pontos (uma série), seguindo o padrão de dataviz do
 * projeto: linha de 2px, pontos com anel na cor do fundo, grade discreta,
 * rótulo só no último ponto e tooltip por hover, toque ou teclado.
 * A página sempre oferece os mesmos valores em tabela/texto.
 */
export function LineChart({ points, domain, tickStep, valueFormat, reference, ariaLabel }: LineChartProps) {
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

  function open(point: LineChartPoint) {
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

          {lastIndex >= 0 && active === null && (
            <text
              x={x(lastIndex)}
              y={y(points[lastIndex].value) - 10}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-semibold tabular"
            >
              {format(points[lastIndex].value)}
            </text>
          )}

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
