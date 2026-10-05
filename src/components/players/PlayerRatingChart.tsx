"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MatchResult } from "@/components/matches/MatchResult";
import { formatRating } from "@/lib/format";
import type { MatchResult as MatchResultValue } from "@/types/match";

export interface RatingPoint {
  href: string;
  rating: number;
  opponent: string;
  /** Data e hora para o tooltip. */
  dateLabel: string;
  /** Data curta para o eixo X. */
  axisLabel: string;
  score: string;
  result: MatchResultValue;
  goals: number;
  assists: number;
}

interface PlayerRatingChartProps {
  /** Ordem cronológica: mais antiga → mais recente. */
  points: RatingPoint[];
  average: number | null;
}

const HEIGHT = 208;
const MARGIN = { top: 20, right: 56, bottom: 28, left: 28 };
const DOT_RADIUS = 4;

function yTicks(min: number, max: number): number[] {
  const step = max - min > 6 ? 2 : 1;
  const ticks: number[] = [];
  for (let value = max; value >= min; value -= step) ticks.push(value);
  return ticks;
}

function contributionLabel(goals: number, assists: number): string | null {
  const parts = [
    goals > 0 && `${goals} ${goals === 1 ? "gol" : "gols"}`,
    assists > 0 && `${assists} ${assists === 1 ? "assistência" : "assistências"}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Nota do jogador em cada partida salva (linha + pontos), com a média como
 * referência. Hover/teclado mostram os detalhes; clique abre a partida.
 * Os mesmos valores estão na tabela de partidas logo abaixo (versão em tabela).
 */
export function PlayerRatingChart({ points, average }: PlayerRatingChartProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const ratings = points.map((point) => point.rating);
  const yMin = Math.max(0, Math.min(5, Math.floor(Math.min(...ratings)) - 1));
  const yMax = 10;
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = points.length > 0 ? innerWidth / points.length : 0;

  const x = (index: number) => MARGIN.left + band * (index + 0.5);
  const y = (rating: number) => MARGIN.top + ((yMax - rating) / (yMax - yMin)) * innerHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.rating)}`)
    .join(" ");

  const lastIndex = points.length - 1;
  const activePoint = active === null ? null : points[active];

  function moveActive(delta: number) {
    setActive((current) => {
      const base = current ?? lastIndex;
      return Math.min(lastIndex, Math.max(0, base + delta));
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") moveActive(-1);
    else if (event.key === "ArrowRight") moveActive(1);
    else if (event.key === "Enter" && activePoint) router.push(activePoint.href);
    else return;
    event.preventDefault();
  }

  const tooltipLeft =
    active === null ? 0 : Math.min(Math.max(x(active), 88), Math.max(88, width - 88));

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-label="Nota por partida. Use as setas para navegar e Enter para abrir a partida."
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
          aria-label={`Notas das últimas ${points.length} partidas${
            average !== null ? `, média ${formatRating(average)}` : ""
          }`}
          onPointerLeave={() => setActive(null)}
          className="block select-none"
        >
          {/* Grade e eixo Y */}
          {yTicks(yMin, yMax).map((tick) => (
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
                {tick}
              </text>
            </g>
          ))}

          {/* Média como referência */}
          {average !== null && (
            <g>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(average)}
                y2={y(average)}
                className="stroke-muted-foreground/60"
                strokeWidth={1}
              />
              <text
                x={width - MARGIN.right + 6}
                y={y(average)}
                dy="0.32em"
                className="fill-muted-foreground text-[11px]"
              >
                média {formatRating(average)}
              </text>
            </g>
          )}

          {/* Crosshair */}
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
              key={point.href}
              cx={x(index)}
              cy={y(point.rating)}
              r={index === active ? DOT_RADIUS + 1.5 : DOT_RADIUS}
              className="fill-chart-1 stroke-card"
              strokeWidth={2}
            />
          ))}

          {/* Rótulo só no último ponto */}
          {lastIndex >= 0 && active === null && (
            <text
              x={x(lastIndex)}
              y={y(points[lastIndex].rating) - 10}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-semibold tabular"
            >
              {formatRating(points[lastIndex].rating)}
            </text>
          )}

          {/* Eixo X: primeira e última data */}
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

          {/* Áreas de hover: uma faixa inteira por partida, maior que o ponto */}
          {points.map((point, index) => (
            <rect
              key={`hit-${point.href}`}
              x={x(index) - band / 2}
              y={MARGIN.top}
              width={band}
              height={innerHeight}
              fill="transparent"
              className="cursor-pointer"
              onPointerEnter={() => setActive(index)}
              // No toque não há hover: o 1º toque mostra o detalhe, o 2º abre a partida.
              onClick={() => (active === index ? router.push(point.href) : setActive(index))}
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
          <p className="text-lg leading-tight font-semibold">{formatRating(activePoint.rating)}</p>
          <p className="truncate text-muted-foreground">vs {activePoint.opponent}</p>
          <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap">
            <MatchResult result={activePoint.result} size="sm" className="size-4 text-[10px]" />
            <span className="font-medium">{activePoint.score}</span>
          </p>
          <p className="text-muted-foreground">{activePoint.dateLabel}</p>
          {contributionLabel(activePoint.goals, activePoint.assists) && (
            <p className="mt-1 text-muted-foreground">
              {contributionLabel(activePoint.goals, activePoint.assists)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
