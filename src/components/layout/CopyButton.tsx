"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

/**
 * Caminho antigo (campo de texto escondido + execCommand), para navegadores
 * embutidos — como o do WhatsApp — que bloqueiam a API de área de transferência.
 */
function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } finally {
    area.remove();
  }
}

/** Copia um texto (ex.: código da tática) para a área de transferência. */
export function CopyButton({ text, label = "Copiar", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    let ok: boolean;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = legacyCopy(text);
    }
    // Se nada funcionar, o texto continua na tela (selecionável) para copiar à mão.
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const Icon = copied ? CheckIcon : CopyIcon;
  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "clip-slant inline-flex h-11 items-center gap-2 bg-primary px-5 font-display text-base font-extrabold tracking-[0.08em] text-primary-foreground uppercase transition-opacity hover:opacity-90",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span aria-live="polite">{copied ? "Copiado!" : label}</span>
    </button>
  );
}
