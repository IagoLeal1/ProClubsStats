"use client";

import { useId, useRef } from "react";
import { GripVerticalIcon } from "lucide-react";

import { findArchetype } from "@/lib/formations/archetypes";
import { FIELD_BOUNDS, LINE_SECTORS, sectorSlots, type LineSector } from "@/lib/formations/templates";
import { formatPositionGroupShort } from "@/lib/format";
import { cn } from "@/lib/utils";

import { FootballPitch } from "./FootballPitch";
import { FormationPlayer } from "./FormationPlayer";
import type { DraftSlot } from "./SlotDialog";

/** Quanto o ponteiro anda (px) antes de virar arrasto em vez de clique. */
const DRAG_THRESHOLD = 4;
/** Passo das setas do teclado (em % do campo); com Shift, o dobro e meio. */
const KEY_STEP = 2;

export interface SlotMove {
  slotIndex: number;
  x: number;
  y: number;
}

interface TacticalBoardProps {
  slots: DraftSlot[];
  names: Map<string, string>;
  selectedIndex: number | null;
  onSelect: (slotIndex: number) => void;
  /** `relabel`: a sigla acompanha a região (arrastar uma carta); falso ao mover uma linha inteira. */
  onMove: (moves: SlotMove[], relabel: boolean) => void;
}

interface DragState {
  kind: "slot" | "line";
  origins: SlotMove[];
  startX: number;
  startY: number;
  moved: boolean;
}

const clampX = (x: number) => Math.min(FIELD_BOUNDS.maxX, Math.max(FIELD_BOUNDS.minX, x));
const clampY = (y: number) => Math.min(FIELD_BOUNDS.maxY, Math.max(FIELD_BOUNDS.minY, y));

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

/**
 * Prancheta do montador: arraste as cartas (ou use as setas) para mudar de
 * posição e as alças da direita para subir ou descer uma linha inteira.
 * Um toque sem arrastar abre a vaga.
 */
export function TacticalBoard({ slots, names, selectedIndex, onSelect, onMove }: TacticalBoardProps) {
  const hintId = useId();
  const pitchRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  // O clique que vem logo depois de um arrasto não deve abrir a vaga.
  const suppressClick = useRef(false);

  function begin(event: React.PointerEvent<HTMLElement>, kind: DragState["kind"], indices: number[]) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      kind,
      origins: indices.map((slotIndex) => ({ slotIndex, x: slots[slotIndex].x, y: slots[slotIndex].y })),
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  }

  function track(event: React.PointerEvent<HTMLElement>) {
    const state = drag.current;
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!state || !rect) return;
    const dxPx = event.clientX - state.startX;
    const dyPx = event.clientY - state.startY;
    if (!state.moved && Math.hypot(dxPx, dyPx) < DRAG_THRESHOLD) return;
    state.moved = true;
    const dx = (dxPx / rect.width) * 100;
    // Na tela, subir é ir em direção ao gol adversário.
    const dy = (-dyPx / rect.height) * 100;
    onMove(
      state.origins.map((origin) => ({
        slotIndex: origin.slotIndex,
        x: state.kind === "line" ? origin.x : clampX(origin.x + dx),
        y: clampY(origin.y + dy),
      })),
      state.kind === "slot",
    );
  }

  function finish() {
    if (drag.current?.moved) {
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }
    drag.current = null;
  }

  function nudge(event: React.KeyboardEvent, indices: number[], kind: DragState["kind"]) {
    const arrow = ARROWS[event.key];
    if (!arrow || (kind === "line" && arrow[1] === 0)) return;
    event.preventDefault();
    const step = event.shiftKey ? KEY_STEP * 2.5 : KEY_STEP;
    onMove(
      indices.map((slotIndex) => ({
        slotIndex,
        x: kind === "line" ? slots[slotIndex].x : clampX(slots[slotIndex].x + arrow[0] * step),
        y: clampY(slots[slotIndex].y + arrow[1] * step),
      })),
      kind === "slot",
    );
  }

  const dragHandlers = (kind: DragState["kind"], indices: number[]) => ({
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => begin(event, kind, indices),
    onPointerMove: track,
    onPointerUp: finish,
    onPointerCancel: finish,
  });

  const lines = LINE_SECTORS.flatMap((sector: LineSector) => {
    const indices = sectorSlots(slots, sector);
    if (indices.length === 0) return [];
    const y = indices.reduce((total, index) => total + slots[index].y, 0) / indices.length;
    return [{ sector, indices, y }];
  });

  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-1.5">
        <div ref={pitchRef} className="min-w-0 flex-1">
          <FootballPitch>
            {lines.map((line) => (
              <div
                key={line.sector}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-foreground/15"
                style={{ bottom: `${line.y}%` }}
              />
            ))}
            {slots.map((slot) => {
              const draggable = slot.slotIndex !== 0;
              return (
                <FormationPlayer
                  key={slot.slotIndex}
                  position={slot.position}
                  name={slot.playerId ? (names.get(slot.playerId) ?? "Jogador") : null}
                  detail={findArchetype(slot.archetype)?.name}
                  x={slot.x}
                  y={slot.y}
                  selected={selectedIndex === slot.slotIndex}
                  onSelect={() => {
                    if (!suppressClick.current) onSelect(slot.slotIndex);
                  }}
                  className={draggable ? "cursor-grab touch-none active:cursor-grabbing" : undefined}
                  buttonProps={
                    draggable
                      ? {
                          ...dragHandlers("slot", [slot.slotIndex]),
                          onKeyDown: (event) => nudge(event, [slot.slotIndex], "slot"),
                          "aria-describedby": hintId,
                        }
                      : undefined
                  }
                />
              );
            })}
          </FootballPitch>
        </div>

        <div className="relative w-9 shrink-0" aria-label="Linhas do time" role="group">
          {lines.map((line) => (
            <button
              key={line.sector}
              type="button"
              {...dragHandlers("line", line.indices)}
              onKeyDown={(event) => nudge(event, line.indices, "line")}
              aria-label={`Linha de ${formatPositionGroupShort(line.sector)} (${line.indices.length}): use as setas para subir ou descer`}
              className={cn(
                "absolute inset-x-0 flex h-12 translate-y-1/2 cursor-ns-resize touch-none flex-col items-center justify-center gap-0.5 rounded-sm border bg-card text-muted-foreground transition-colors outline-none hover:border-primary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring",
              )}
              style={{ bottom: `${line.y}%` }}
            >
              <GripVerticalIcon className="size-4" aria-hidden />
              <span className="font-display text-[10px] font-bold">{formatPositionGroupShort(line.sector)}</span>
            </button>
          ))}
        </div>
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        Arraste as cartas (ou use as setas do teclado) para mudar de posição — a sigla acompanha a região. As
        alças da direita sobem ou descem a linha inteira. Toque numa carta para escolher jogador, arquétipo e
        pontos fortes.
      </p>
    </div>
  );
}
