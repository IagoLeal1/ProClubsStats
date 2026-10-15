"use client";

import { useState } from "react";
import { KeyRoundIcon, PenLineIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { DB_TABLES, type TableId } from "./content";

const TABLE_BY_ID = new Map(DB_TABLES.map((table) => [table.id, table]));
const countFormat = new Intl.NumberFormat("pt-BR");

/** Grade 3 × 3 no computador: clube à esquerda, partidas no meio, detalhes à direita. */
const ORDER: TableId[] = [
  "club_progress",
  "players",
  "player_progress",
  "clubs",
  "matches",
  "player_match_stats",
  "formations",
  "formation_players",
  "match_team_stats",
];

type Relation = "selected" | "parent" | "child" | "none";

function relationTo(selected: TableId, id: TableId): Relation {
  if (id === selected) return "selected";
  if (TABLE_BY_ID.get(selected)?.parents.includes(id)) return "parent";
  if (TABLE_BY_ID.get(id)?.parents.includes(selected)) return "child";
  return "none";
}

const RELATION_TAG: Partial<Record<Relation, string>> = {
  parent: "Pertence a",
  child: "Tem muitas",
};

export type TableCounts = Partial<Record<TableId, number>>;

/** As nove tabelas: escolher uma mostra com quem ela se liga e o que guarda. */
export function DatabaseExplorer({ counts }: { counts: TableCounts | null }) {
  const [selected, setSelected] = useState<TableId>("matches");
  const table = TABLE_BY_ID.get(selected) ?? DB_TABLES[0];
  const children = DB_TABLES.filter((item) => item.parents.includes(selected));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {ORDER.map((id) => {
          const relation = relationTo(selected, id);
          const tag = RELATION_TAG[relation];
          const count = counts?.[id];
          return (
            <button
              key={id}
              type="button"
              aria-pressed={relation === "selected"}
              onClick={() => setSelected(id)}
              className={cn(
                "flex min-w-0 items-center justify-between gap-3 border bg-card px-3.5 py-3 text-left transition-all duration-200",
                relation === "selected" && "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]",
                relation === "parent" && "border-primary/60",
                relation === "child" && "border-dashed border-primary/60",
                relation === "none" && "opacity-45 hover:opacity-80",
              )}
            >
              <span className="min-w-0 space-y-0.5">
                {tag && <span className="kicker block text-[11px] text-muted-foreground">{tag}</span>}
                <span className="block truncate font-mono text-[13px] font-semibold">{id}</span>
              </span>
              {count !== undefined && (
                <span className="shrink-0 text-right">
                  <span className="figure block text-xl text-primary tabular">{countFormat.format(count)}</span>
                  <span className="text-[11px] text-muted-foreground">{count === 1 ? "linha" : "linhas"}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="space-y-4 border bg-card p-4 sm:p-5">
        <div className="space-y-1.5">
          <h3 className="font-mono text-lg font-semibold break-all text-primary">{table.id}</h3>
          <p className="text-muted-foreground">{table.text}</p>
        </div>

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="space-y-1.5">
            <dt className="kicker flex items-center gap-1.5 text-muted-foreground">
              <KeyRoundIcon className="size-3.5" aria-hidden /> Chave natural
            </dt>
            <dd className="space-y-1">
              <code className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-xs">{table.key}</code>
              <p className="text-xs text-muted-foreground">Gravar a mesma coisa de novo atualiza a linha em vez de duplicar.</p>
            </dd>
          </div>
          <div className="space-y-1.5">
            <dt className="kicker flex items-center gap-1.5 text-muted-foreground">
              <PenLineIcon className="size-3.5" aria-hidden /> Quem grava
            </dt>
            <dd>{table.writtenBy}</dd>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <dt className="kicker text-muted-foreground">Colunas principais</dt>
            <dd className="flex flex-wrap gap-1.5">
              {table.columns.map((column) => (
                <code key={column} className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-xs">
                  {column}
                </code>
              ))}
            </dd>
          </div>
          <Relations label="Pertence a" ids={table.parents} empty="Nenhuma: é o topo." />
          <Relations label="Tem muitas" ids={children.map((item) => item.id)} empty="Nenhuma." />
        </dl>
      </div>
    </div>
  );
}

function Relations({ label, ids, empty }: { label: string; ids: TableId[]; empty: string }) {
  return (
    <div className="space-y-1.5">
      <dt className="kicker text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {ids.length === 0 ? (
          <span className="text-muted-foreground">{empty}</span>
        ) : (
          ids.map((id) => (
            <code key={id} className="rounded-sm border border-primary/40 px-1.5 py-0.5 font-mono text-xs">
              {id}
            </code>
          ))
        )}
      </dd>
    </div>
  );
}
