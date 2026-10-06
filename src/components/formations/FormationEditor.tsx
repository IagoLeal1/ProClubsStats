"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EyeIcon, Loader2Icon, SaveIcon, Trash2Icon } from "lucide-react";

import {
  deleteFormationAction,
  saveFormationAction,
  type FormationInputPayload,
  type SaveFormationState,
} from "@/app/actions/formations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findArchetype } from "@/lib/formations/archetypes";
import { attributeLabel } from "@/lib/formations/attributes";
import {
  FORMATION_TEMPLATES,
  FORMATION_TYPES,
  isFormationType,
  matchSlots,
  SLOTS_PER_FORMATION,
  type FormationType,
} from "@/lib/formations/templates";
import { EMPTY_ROLES, FORMATION_ROLES, type Formation, type FormationRoles } from "@/types/formation";

import { FootballPitch } from "./FootballPitch";
import { FormationPlayer } from "./FormationPlayer";
import { SlotDialog, type DraftSlot, type EditorMember } from "./SlotDialog";

interface FormationEditorProps {
  clubId: string;
  members: EditorMember[];
  /** null = formação nova. */
  formation: Formation | null;
  /** Link da escalação (modo de visualização) de uma formação já salva. */
  viewHref?: string;
}

const IDLE: SaveFormationState = { status: "idle" };

function toDraftSlots(formation: Formation | null): DraftSlot[] {
  return Array.from({ length: SLOTS_PER_FORMATION }, (_, slotIndex) => {
    const saved = formation?.slots.find((slot) => slot.slotIndex === slotIndex);
    return {
      slotIndex,
      playerId: saved?.playerId ?? null,
      archetype: saved?.archetype ?? null,
      strengths: saved?.strengths ?? [],
      notes: saved?.notes ?? "",
    };
  });
}

function initialType(formation: Formation | null): FormationType {
  return formation && isFormationType(formation.formationType) ? formation.formationType : "4-3-3";
}

/** Representação estável do rascunho, para saber se há alterações não salvas. */
const snapshot = (name: string, type: string, slots: DraftSlot[], roles: FormationRoles) =>
  JSON.stringify([
    name.trim(),
    type,
    slots.map((slot) => ({ ...slot, notes: slot.notes.trim() })),
    FORMATION_ROLES.map(({ role }) => roles[role]),
  ]);

/** Funções só valem para quem está escalado: quem sai do time perde a função. */
function activeRoles(roles: FormationRoles, slots: DraftSlot[]): FormationRoles {
  const lineup = new Set(slots.flatMap((slot) => (slot.playerId ? [slot.playerId] : [])));
  const result = { ...EMPTY_ROLES };
  for (const { role } of FORMATION_ROLES) {
    const playerId = roles[role];
    result[role] = playerId && lineup.has(playerId) ? playerId : null;
  }
  return result;
}

export function FormationEditor({ clubId, members, formation, viewHref }: FormationEditorProps) {
  const [name, setName] = useState(formation?.name ?? "Titular");
  const [formationType, setFormationType] = useState<FormationType>(initialType(formation));
  const [slots, setSlots] = useState<DraftSlot[]>(() => toDraftSlots(formation));
  const [roles, setRoles] = useState<FormationRoles>(formation?.roles ?? EMPTY_ROLES);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [saveState, save, saving] = useActionState(saveFormationAction, IDLE);
  const [deleteState, remove, deleting] = useActionState(deleteFormationAction, IDLE);

  const template = FORMATION_TEMPLATES[formationType];
  const memberNames = useMemo(() => new Map(members.map((member) => [member.id, member.name])), [members]);

  // Depois de salvar, o servidor devolve a formação atualizada: comparar com ela
  // diz se ainda há alterações pendentes.
  const savedSnapshot = snapshot(
    formation?.name ?? "",
    formation?.formationType ?? "",
    toDraftSlots(formation),
    formation?.roles ?? EMPTY_ROLES,
  );
  const currentRoles = activeRoles(roles, slots);
  const dirty = !formation || snapshot(name, formationType, slots, currentRoles) !== savedSnapshot;
  // Quem pode receber uma função: os escalados, na ordem das vagas.
  const lineup = slots.flatMap((slot) =>
    slot.playerId ? [{ playerId: slot.playerId, position: template[slot.slotIndex].position }] : [],
  );
  const roleBadges = (playerId: string | null) =>
    playerId ? FORMATION_ROLES.filter(({ role }) => currentRoles[role] === playerId) : [];

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const assignedPositions = new Map(
    slots.flatMap((slot) =>
      slot.playerId ? [[slot.playerId, template[slot.slotIndex].position] as const] : [],
    ),
  );

  function updateSlot(slotIndex: number, patch: Partial<Omit<DraftSlot, "slotIndex">>) {
    setSlots((current) =>
      current.map((slot) => {
        if (slot.slotIndex === slotIndex) return { ...slot, ...patch };
        // Um jogador só ocupa uma vaga: ao escalá-lo aqui, ele sai da anterior.
        if (patch.playerId && slot.playerId === patch.playerId) return { ...slot, playerId: null };
        return slot;
      }),
    );
  }

  function changeFormationType(next: FormationType) {
    const mapping = matchSlots(formationType, next);
    setSlots((current) =>
      mapping.map((oldIndex, slotIndex) => {
        const source = oldIndex === null ? undefined : current[oldIndex];
        return source
          ? { ...source, slotIndex }
          : { slotIndex, playerId: null, archetype: null, strengths: [], notes: "" };
      }),
    );
    setFormationType(next);
  }

  function handleSave() {
    const payload: FormationInputPayload = {
      clubId,
      formationId: formation?.id ?? null,
      name,
      formationType,
      slots: slots.map((slot) => ({ ...slot, notes: slot.notes.trim() || null })),
      roles: currentRoles,
    };
    startTransition(() => save(payload));
  }

  function handleDelete() {
    if (!formation) return;
    startTransition(() => remove({ clubId, formationId: formation.id }));
  }

  const editingSlot = editingIndex === null ? null : slots[editingIndex];
  const status = saveState.status === "error" ? saveState : deleteState.status === "error" ? deleteState : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1 space-y-1.5 sm:max-w-xs">
          <span className="kicker block text-muted-foreground">Nome</span>
          <Input
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            className="h-11 rounded-sm bg-card font-display text-xl font-bold"
          />
        </label>
        <label className="space-y-1.5">
          <span className="kicker block text-muted-foreground">Esquema</span>
          <select
            value={formationType}
            onChange={(event) => {
              if (isFormationType(event.target.value)) changeFormationType(event.target.value);
            }}
            className="h-11 rounded-sm border bg-card px-3 font-display text-xl font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {FORMATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || !dirty || !name.trim()}
            className="clip-slant h-11 rounded-none px-6 font-display text-base font-extrabold tracking-[0.08em] uppercase"
          >
            {saving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
            {saving ? "Salvando…" : formation ? "Salvar alterações" : "Criar formação"}
          </Button>
          {viewHref && (
            <Link
              href={viewHref}
              className="inline-flex h-11 items-center gap-2 border border-input px-4 font-display text-base font-bold tracking-[0.08em] uppercase transition-colors hover:bg-surface"
            >
              <EyeIcon className="size-4" aria-hidden /> Ver escalação
            </Link>
          )}
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {status ? (
              <span className="text-destructive">{status.message}</span>
            ) : dirty && formation ? (
              "Alterações não salvas"
            ) : saveState.status === "saved" ? (
              "Salvo"
            ) : null}
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <FootballPitch className="mx-auto max-w-md">
          {slots.map((slot) => {
            const position = template[slot.slotIndex];
            return (
              <FormationPlayer
                key={slot.slotIndex}
                position={position.position}
                name={slot.playerId ? (memberNames.get(slot.playerId) ?? "Jogador") : null}
                detail={findArchetype(slot.archetype)?.name}
                x={position.x}
                y={position.y}
                selected={editingIndex === slot.slotIndex}
                onSelect={() => setEditingIndex(slot.slotIndex)}
              />
            );
          })}
        </FootballPitch>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Clique em uma posição no campo ou na lista para escolher o jogador, o arquétipo e os
            pontos fortes.
          </p>
          <ul className="divide-y border bg-card">
            {slots.map((slot) => {
              const position = template[slot.slotIndex];
              const archetype = findArchetype(slot.archetype);
              return (
                <li key={slot.slotIndex}>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(slot.slotIndex)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className="clip-slant-sm w-11 shrink-0 bg-surface py-0.5 text-center font-display text-sm font-bold">
                      {position.position}
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">
                          {slot.playerId ? memberNames.get(slot.playerId) : <span className="text-muted-foreground">IA</span>}
                          {archetype && <span className="font-normal text-primary"> · {archetype.name}</span>}
                        </span>
                        {roleBadges(slot.playerId).map(({ role, label, badge }) => (
                          <span
                            key={role}
                            title={label}
                            className="grid size-5 shrink-0 place-items-center rounded-full bg-primary font-display text-[11px] font-extrabold text-primary-foreground"
                          >
                            {badge}
                          </span>
                        ))}
                      </span>
                      {slot.strengths.length > 0 && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {slot.strengths.map(attributeLabel).join(", ")}
                        </span>
                      )}
                      {slot.notes.trim() && (
                        <span className="block truncate text-xs text-muted-foreground italic">
                          {slot.notes}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <section className="space-y-3 border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold tracking-[0.06em] uppercase">Capitão e bola parada</h3>
          <p className="text-xs text-muted-foreground">
            {lineup.length > 0
              ? "Só quem está escalado pode receber uma função."
              : "Escale alguém no campo para definir capitão e cobradores."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {FORMATION_ROLES.map(({ role, label, badge }) => (
            <label key={role} className="space-y-1.5">
              <span className="flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded-full bg-primary font-display text-[11px] font-extrabold text-primary-foreground">
                  {badge}
                </span>
                <span className="kicker text-muted-foreground">{label}</span>
              </span>
              <select
                value={currentRoles[role] ?? ""}
                disabled={lineup.length === 0}
                onChange={(event) => setRoles((current) => ({ ...current, [role]: event.target.value || null }))}
                className="h-11 w-full rounded-sm border bg-background px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="">Ninguém definido</option>
                {lineup.map(({ playerId, position }) => (
                  <option key={playerId} value={playerId}>
                    {memberNames.get(playerId) ?? "Jogador"} ({position})
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      {formation && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-6">
          {confirmingDelete ? (
            <>
              <span className="text-sm">Excluir “{formation.name}” de vez?</span>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
                Sim, excluir
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
              <Trash2Icon /> Excluir formação
            </Button>
          )}
        </div>
      )}

      {editingSlot && (
        <SlotDialog
          open
          onOpenChange={(open) => !open && setEditingIndex(null)}
          slot={editingSlot}
          template={template[editingSlot.slotIndex]}
          members={members}
          assignedPositions={assignedPositions}
          onChange={(patch) => updateSlot(editingSlot.slotIndex, patch)}
        />
      )}
    </div>
  );
}
