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
import type { SlotTemplate } from "@/lib/formations/templates";
import { cn } from "@/lib/utils";
import type { PositionGroup } from "@/types/player";

export interface EditorMember {
  id: string;
  name: string;
  proName: string | null;
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
  "h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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

  function toggleStrength(id: string) {
    onChange({
      strengths: slot.strengths.includes(id)
        ? slot.strengths.filter((strength) => strength !== id)
        : [...slot.strengths, id],
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {template.position} · vaga {slot.slotIndex + 1}
          </DialogTitle>
          <DialogDescription>
            Quem joga aqui, o arquétipo ideal para a posição e os pontos fortes a priorizar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Jogador</span>
            <select
              className={fieldClass}
              value={slot.playerId ?? ""}
              onChange={(event) => onChange({ playerId: event.target.value || null })}
            >
              <option value="">IA (vaga sem jogador)</option>
              {members.map((member) => {
                const elsewhere =
                  member.id !== slot.playerId ? assignedPositions.get(member.id) : undefined;
                return (
                  <option key={member.id} value={member.id}>
                    {member.name}
                    {member.proName ? ` (${member.proName})` : ""}
                    {elsewhere ? ` — sai de ${elsewhere}` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="space-y-1.5">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Arquétipo</span>
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
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <p>{archetype.description}</p>
                <p className="mt-1 text-muted-foreground">
                  Estilo de jogo de assinatura: <span className="text-foreground">{archetype.signature}</span>
                </p>
              </div>
            )}
          </div>

          <fieldset className="space-y-3">
            <legend className="flex w-full items-baseline justify-between text-xs font-medium text-muted-foreground">
              <span>Pontos fortes</span>
              <span className="tabular" aria-live="polite">
                {slot.strengths.length}/{MAX_STRENGTHS}
              </span>
            </legend>
            {groups.map((group) => (
              <div key={group.id} className="space-y-1.5">
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{group.label}</p>
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
                          "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-40",
                          selected
                            ? "border-primary bg-primary/15 text-primary"
                            : "text-muted-foreground hover:text-foreground",
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
            <span className="text-xs font-medium text-muted-foreground">Observação</span>
            <Textarea
              value={slot.notes}
              maxLength={280}
              onChange={(event) => onChange({ notes: event.target.value })}
              placeholder="Ex.: fica mais preso na marcação, cobra os escanteios"
            />
          </label>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => onChange({ playerId: null, archetype: null, strengths: [], notes: "" })}
          >
            Limpar vaga
          </Button>
          <Button onClick={() => onOpenChange(false)}>Pronto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
