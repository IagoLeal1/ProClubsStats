"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, SearchIcon } from "lucide-react";

import { copyText } from "@/components/layout/CopyButton";
import { Input } from "@/components/ui/input";

import { CHANGE_GUIDES } from "./content";

/** Minúsculas e sem acento, para "formacao" achar "formação". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** O caminho mais curto para as mudanças mais comuns, com busca. */
export function WhereToChange() {
  const [query, setQuery] = useState("");
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const guides = CHANGE_GUIDES.filter((guide) => {
    const haystack = normalize([guide.want, guide.note ?? "", ...guide.paths].join(" "));
    return terms.every((term) => haystack.includes(term));
  });

  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Buscar uma mudança</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex.: estatística, cores, WhatsApp, banco…"
          className="h-11 rounded-sm pl-9"
        />
      </label>

      {guides.length === 0 ? (
        <p className="border border-dashed p-4 text-sm text-muted-foreground">
          Nada com “{query.trim()}”. Tente outra palavra, como “partida”, “tela” ou “sincronização”.
        </p>
      ) : (
        <ul className="divide-y border bg-card">
          {guides.map((guide) => (
            <li key={guide.want} className="grid gap-2 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-6">
              <div className="space-y-0.5">
                <p className="font-semibold">{guide.want}</p>
                {guide.note && <p className="text-sm text-muted-foreground">{guide.note}</p>}
              </div>
              <ul className="flex flex-wrap content-start gap-1.5">
                {guide.paths.map((path) => (
                  <li key={path}>
                    <PathChip path={path} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PathChip({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!(await copyText(path))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const Icon = copied ? CheckIcon : CopyIcon;
  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar caminho"
      className="group inline-flex max-w-full items-center gap-1.5 rounded-sm bg-surface px-2 py-1 text-left font-mono text-xs transition-colors hover:bg-primary/15"
    >
      <span className="break-all">{path}</span>
      <Icon
        className={copied ? "size-3.5 shrink-0 text-primary" : "size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground"}
        aria-hidden
      />
      <span className="sr-only" aria-live="polite">
        {copied ? "Copiado" : "Copiar"}
      </span>
    </button>
  );
}
