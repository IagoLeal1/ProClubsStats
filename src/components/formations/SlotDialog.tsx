"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ARCHETYPES, findArchetype } from "@/lib/formations/archetypes";
import { ATTRIBUTE_GROUPS, MAX_STRENGTHS } from "@/lib/formations/attributes";
import { formatPositionGroupPlace, formatPositionGroupShort, formatRating } from "@/lib/format";
import type { SlotTemplate } from "@/lib/formations/templates";
import { MIN_POSITION_GAMES, type PositionRatings } from "@/lib/stats/positions";
import { cn } from "@/lib/utils";
import type { PositionGroup } from "@/types/player";

export interface EditorMember {
  id: string;
  name: string;
  proName: string | null;
  /** Nota média por setor nas partidas salvas. */
  ratings: PositionRatings;
}

export interface DraftSlot {
  slotIndex: number;
  playerId: string | null;
  archetype: string | null;
  strengths: string[];
  notes: string;
}

const GROUP_LABELS: Record<PositionGroup, string> = {
  goalkeeper: "goleiros",
  defender: "defensores",
  midfielder: "meio-campistas",
  forward: "atacantes",
};

const fieldClass =
  "h-11 w-full rounded-sm border bg-background px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface SlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: DraftSlot;
  template: SlotTemplate;
  members: EditorMember[];
  /** Posição atual de cada jogador já escalado, para avisar quem vai mudar de vaga. */
  assignedPositions: Map<string, string>;
  onChange: (patch: Partial<Omit<DraftSlot, "slotIndex">>) => void;
}

export function SlotDialog({
  open,
  onOpenChange,
  slot,
  template,
  members,
  assignedPositions,
  onChange,
}: SlotDialogProps) {
  const archetype = findArchetype(slot.archetype);
  const suggested = ARCHETYPES.filter((option) => option.group === template.group);
  const others = ARCHETYPES.filter((option) => option.group !== template.group);
  // Goleiro vê os atributos de goleiro primeiro; na linha eles já ficam no fim da lista.
  const groups =
    template.group === "goalkeeper"
      ? [...ATTRIBUTE_GROUPS].sort(
          (a, b) => Number(b.id === "goalkeeping") - Number(a.id === "goalkeeping"),
        )
      : ATTRIBUTE_GROUPS;
  const atLimit = slot.strengths.length >= MAX_STRENGTHS;
  // Sugestões: quem tem as melhores notas neste setor.
  const bestHere = members
    .flatMap((member) => {
      const rating = member.ratings[template.group];
      return rating && rating.games >= MIN_POSITION_GAMES ? [{ member, rating }] : [];
    })
    .sort((a, b) => b.rating.averageRating - a.rating.averageRating)
    .slice(0, 3);

  function toggleStrength(id: string) {
    onChange({
      strengths: slot.strengths.includes(id)
        ? slot.strengths.filter((strength) => strength !== id)
        : [...slot.strengths, id],
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* No celular abre como painel que sobe do rodapé; no computador, centralizado. */}
      <DialogContent className="max-h-[88dvh] gap-5 overflow-y-auto rounded-sm border-t-2 border-primary bg-card p-5 sm:max-w-lg max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-[14px] max-sm:rounded-b-none max-sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle className="figure text-3xl uppercase">
            {template.position} · vaga {slot.slotIndex + 1}
          </DialogTitle>
          <DialogDescription>
            Quem joga aqui, o arquétipo ideal para a posição e os pontos fortes a priorizar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block space-y-1.5">
              <span className="kicker text-muted-foreground">Jogador</span>
              <select
                className={fieldClass}
                value={slot.playerId ?? ""}
                onChange={(event) => onChange({ playerId: event.target.value || null })}
              >
                <option value="">IA (vaga sem jogador)</option>
                {members.map((member) => {
                  const elsewhere =
                    member.id !== slot.playerId ? assignedPositions.get(member.id) : undefined;
                  const rating = member.ratings[template.group];
                  return (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {member.proName ? ` (${member.proName})` : ""}
                      {rating
                        ? ` · ${formatRating(rating.averageRating)} de ${formatPositionGroupShort(template.group)}`
                        : ""}
                      {elsewhere ? ` — sai de ${elsewhere}` : ""}
                    </option>
                  );
                })}
              </select>
            </label>
            {bestHere.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Rendem mais {formatPositionGroupPlace(template.group)}:</span>
                {bestHere.map(({ member, rating }) => {
                  const chosen = slot.playerId === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      aria-pressed={chosen}
                      onClick={() => onChange({ playerId: member.id })}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 font-semibold transition-colors hover:border-primary",
                        chosen && "border-primary bg-primary/10",
                      )}
                    >
                      {member.name}{" "}
                      <span className="font-display font-bold text-primary tabular">
                        {formatRating(rating.averageRating)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block space-y-1.5">
              <span className="kicker text-muted-foreground">Arquétipo</span>
              <select
                className={fieldClass}
                value={slot.archetype ?? ""}
                onChange={(event) => onChange({ archetype: event.target.value || null })}
              >
                <option value="">Sem arquétipo definido</option>
                <optgroup label={`Indicados para ${GROUP_LABELS[template.group]}`}>
                  {suggested.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Outros">
                  {others.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            {archetype && (
              <div className="flex gap-3 border bg-background p-3 text-sm">
                <span className="figure clip-slant flex size-10 shrink-0 items-center justify-center bg-primary text-lg text-primary-foreground">
                  {archetype.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="space-y-0.5">
                  <p>{archetype.description}</p>
                  <p className="text-muted-foreground">
                    Estilo de jogo de assinatura:{" "}
                    <span className="font-semibold text-foreground">{archetype.signature}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <fieldset className="space-y-3">
            <legend className="kicker flex w-full items-baseline justify-between text-muted-foreground">
              <span>Pontos fortes</span>
              <span className="text-primary tabular" aria-live="polite">
                {slot.strengths.length}/{MAX_STRENGTHS}
              </span>
            </legend>
            {groups.map((group) => (
              <div key={group.id} className="space-y-1.5">
                <p className="text-xs text-muted-foreground">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.attributes.map((attribute) => {
                    const selected = slot.strengths.includes(attribute.id);
                    return (
                      <button
                        key={attribute.id}
                        type="button"
                        aria-pressed={selected}
                        disabled={!selected && atLimit}
                        onClick={() => toggleStrength(attribute.id)}
                        className={cn(
                          "min-h-9 rounded-full border px-3 text-sm font-semibold transition-colors disabled:opacity-35",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input text-foreground hover:border-primary",
                        )}
                      >
                        {attribute.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </fieldset>

          <label className="block space-y-1.5">
            <span className="kicker text-muted-foreground">Observação</span>
            <Textarea
              value={slot.notes}
              maxLength={280}
              onChange={(event) => onChange({ notes: event.target.value })}
              placeholder="Ex.: fica mais preso na marcação, cobra os escanteios"
              className="rounded-sm bg-background"
            />
          </label>
        </div>

        <DialogFooter className="-mx-5 -mb-5 grid grid-cols-2 gap-2.5 border-t-0 bg-transparent p-5 pt-0 sm:flex sm:justify-between">
          <Button
            variant="outline"
            className="h-12 rounded-sm font-display text-base font-bold tracking-[0.08em] uppercase"
            onClick={() => onChange({ playerId: null, archetype: null, strengths: [], notes: "" })}
          >
            Limpar vaga
          </Button>
          <Button
            className="clip-slant h-12 rounded-none px-8 font-display text-base font-extrabold tracking-[0.08em] uppercase"
            onClick={() => onOpenChange(false)}
          >
            Pronto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
