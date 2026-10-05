"use client";

import { useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /** Texto que acompanha o link (ex.: o placar da noite). */
  text: string;
  title?: string;
  label?: string;
  className?: string;
}

/**
 * Compartilha a página atual: no celular abre a folha nativa (WhatsApp,
 * Telegram…); no computador abre o WhatsApp Web com o texto e o link.
 */
export function ShareButton({ text, title, label = "Compartilhar", className }: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setShared(true);
      } catch {
        // Usuário cancelou a folha de compartilhamento: nada a fazer.
      }
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
    setShared(true);
  }

  const Icon = shared ? CheckIcon : Share2Icon;
  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "clip-slant flex h-12 items-center justify-center gap-2.5 bg-primary px-6 font-display text-lg font-extrabold tracking-[0.08em] text-primary-foreground uppercase transition-opacity hover:opacity-90",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </button>
  );
}
