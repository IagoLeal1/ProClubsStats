"use client";

import { useActionState } from "react";
import { ArrowRightIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";

import {
  openClubAction,
  refreshClubAction,
  type SyncClubActionState,
} from "@/app/actions/sync-club";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Platform } from "@/types/club";

interface SyncClubButtonProps {
  eaClubId: number;
  platform: Platform;
  /** open: sincroniza e abre o dashboard. refresh: sincroniza e fica na página. */
  mode: "open" | "refresh";
  /** Rótulo alternativo do botão. */
  label?: string;
  className?: string;
}

const INITIAL_STATE: SyncClubActionState = { status: "idle" };

const LABELS = {
  open: { idle: "Ver estatísticas", pending: "Buscando dados…", icon: ArrowRightIcon },
  refresh: { idle: "Atualizar", pending: "Atualizando…", icon: RefreshCwIcon },
} as const;

export function SyncClubButton({ eaClubId, platform, mode, label, className }: SyncClubButtonProps) {
  const [state, formAction, pending] = useActionState(
    mode === "open" ? openClubAction : refreshClubAction,
    INITIAL_STATE,
  );
  const labels = LABELS[mode];
  const Icon = pending ? Loader2Icon : labels.icon;

  return (
    <form action={formAction} className={cn("flex flex-col gap-1.5", className)}>
      <input type="hidden" name="eaClubId" value={eaClubId} />
      <input type="hidden" name="platform" value={platform} />
      <Button
        type="submit"
        variant={mode === "open" ? "default" : "outline"}
        disabled={pending}
        className="w-full sm:w-auto"
      >
        {mode === "refresh" && <Icon className={cn(pending && "animate-spin")} data-icon="inline-start" />}
        {pending ? labels.pending : (label ?? labels.idle)}
        {mode === "open" && <Icon className={cn(pending && "animate-spin")} data-icon="inline-end" />}
      </Button>

      <div aria-live="polite" className="text-xs">
        {state.status === "error" && <p className="text-destructive">{state.message}</p>}
        {state.status === "done" && (
          <>
            <p className="text-muted-foreground">{state.message}</p>
            {state.warnings.map((warning) => (
              <p key={warning} className="text-amber-400">
                {warning}
              </p>
            ))}
          </>
        )}
      </div>
    </form>
  );
}
