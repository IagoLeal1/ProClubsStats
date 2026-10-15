"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { CODE_LAYERS, type LayerId } from "./content";

const LAYER_BY_ID = new Map(CODE_LAYERS.map((layer) => [layer.id, layer]));

/**
 * Posição de cada camada: no computador, telas à esquerda e robô à direita;
 * no celular, um lado depois do outro.
 */
const AREAS: Record<LayerId, string> = {
  app: "[grid-area:app]",
  components: "[grid-area:comp]",
  stats: "[grid-area:stats]",
  db: "[grid-area:db]",
  script: "[grid-area:script]",
  sync: "[grid-area:sync]",
  ea: "[grid-area:ea]",
};

type Relation = "selected" | "uses" | "used-by" | "none";

function relationTo(selected: LayerId, id: LayerId): Relation {
  if (id === selected) return "selected";
  if (LAYER_BY_ID.get(selected)?.uses.includes(id)) return "uses";
  if (LAYER_BY_ID.get(id)?.uses.includes(selected)) return "used-by";
  return "none";
}

/** Rótulo em relação à camada escolhida. */
const RELATION_TAG: Partial<Record<Relation, string>> = {
  uses: "Dependência",
  "used-by": "Depende dela",
};

export function CodeLayers() {
  const [selected, setSelected] = useState<LayerId>("app");
  const layer = LAYER_BY_ID.get(selected) ?? CODE_LAYERS[0];
  const usedBy = CODE_LAYERS.filter((item) => item.uses.includes(selected));

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid gap-2.5",
          "grid-cols-2 [grid-template-areas:'app_app'_'comp_stats'_'db_db'_'script_script'_'sync_sync'_'ea_ea']",
          "md:grid-cols-4 md:[grid-template-areas:'app_app_script_script'_'comp_stats_sync_sync'_'db_db_ea_ea']",
        )}
      >
        {CODE_LAYERS.map((item) => {
          const relation = relationTo(selected, item.id);
          const tag = RELATION_TAG[relation];
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={relation === "selected"}
              onClick={() => setSelected(item.id)}
              className={cn(
                AREAS[item.id],
                "flex min-w-0 flex-col items-start gap-1 border bg-card p-3.5 text-left transition-all duration-200 sm:p-4",
                relation === "selected" && "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]",
                relation === "uses" && "border-primary/60",
                relation === "used-by" && "border-dashed border-primary/60",
                relation === "none" && "opacity-45 hover:opacity-80",
              )}
            >
              <span className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <code className="font-mono text-xs font-semibold break-all text-primary">{item.path}</code>
                {tag && <span className="kicker text-[11px] text-muted-foreground">{tag}</span>}
              </span>
              <span className="font-display text-lg font-bold uppercase">{item.name}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="space-y-3 border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <code className="font-mono text-xs text-primary">{layer.path}</code>
          <h3 className="font-display text-2xl font-bold uppercase">{layer.name}</h3>
        </div>
        <p className="text-muted-foreground">{layer.text}</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <LayerList label="Usa" ids={layer.uses} empty="Nenhuma camada: não depende de nada." />
          <LayerList label="É usada por" ids={usedBy.map((item) => item.id)} empty="Ninguém: é o ponto de entrada." />
        </dl>
      </div>
    </div>
  );
}

function LayerList({ label, ids, empty }: { label: string; ids: LayerId[]; empty: string }) {
  return (
    <div className="space-y-1.5">
      <dt className="kicker text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {ids.length === 0 ? (
          <span className="text-muted-foreground">{empty}</span>
        ) : (
          ids.map((id) => (
            <code key={id} className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-xs">
              {LAYER_BY_ID.get(id)?.path}
            </code>
          ))
        )}
      </dd>
    </div>
  );
}
