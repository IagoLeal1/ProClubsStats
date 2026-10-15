"use client";

import { useState } from "react";
import { ArrowRightIcon, DatabaseIcon, FileCodeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { SYNC_STEPS } from "./content";

/** As etapas de uma sincronização, uma aba por etapa, com o que cada uma grava. */
export function SyncSteps() {
  const [current, setCurrent] = useState(0);

  return (
    <Tabs value={current} onValueChange={(value) => setCurrent(Number(value))} className="gap-0">
      <TabsList
        variant="line"
        className="grid w-full grid-cols-5 gap-1.5 group-data-horizontal/tabs:h-auto"
        aria-label="Etapas da sincronização"
      >
        {SYNC_STEPS.map((step, index) => (
          <TabsTrigger
            key={step.title}
            value={index}
            className="h-auto flex-col items-start gap-1 rounded-none border-0 px-0 pt-0 pb-3 text-left after:hidden data-active:bg-transparent dark:data-active:bg-transparent"
          >
            <span
              aria-hidden
              className={cn(
                "mb-2.5 block h-[3px] w-full transition-colors",
                index === current ? "bg-primary" : index < current ? "bg-primary/45" : "bg-border",
              )}
            />
            <span className={cn("figure text-3xl sm:text-4xl", index <= current ? "text-primary" : "text-muted-foreground")}>
              {index + 1}
            </span>
            <span className="font-display text-sm font-bold tracking-[0.06em] uppercase max-sm:sr-only">
              {step.title}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {SYNC_STEPS.map((step, index) => (
        <TabsContent key={step.title} value={index} className="border bg-card p-4 text-base sm:p-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
            <div className="space-y-2">
              <p className="kicker text-primary">
                Etapa {index + 1} de {SYNC_STEPS.length}
              </p>
              <h3 className="font-display text-3xl font-bold uppercase">{step.title}</h3>
              <p className="text-muted-foreground">{step.text}</p>
            </div>

            <div className="space-y-4 md:border-l md:pl-5">
              <div className="space-y-2">
                <p className="kicker flex items-center gap-1.5 text-muted-foreground">
                  <DatabaseIcon className="size-3.5" aria-hidden /> Grava
                </p>
                {step.writes.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {step.writes.map((table) => (
                      <li key={table}>
                        <code className="rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                          {table}
                        </code>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nada nesta etapa.</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="kicker flex items-center gap-1.5 text-muted-foreground">
                  <FileCodeIcon className="size-3.5" aria-hidden /> Código
                </p>
                <code className="block rounded-sm bg-surface px-2 py-1 font-mono text-xs break-all">{step.file}</code>
              </div>
            </div>
          </div>

          {index < SYNC_STEPS.length - 1 && (
            <Button variant="outline" className="mt-5" onClick={() => setCurrent(index + 1)}>
              Próxima: {SYNC_STEPS[index + 1].title}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
