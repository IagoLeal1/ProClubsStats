"use client";

import { useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  /** Texto que acompanha o link (ex.: o placar da noite). */
  text: string;
  title?: string;
}

/**
 * Compartilha a página atual: no celular abre a folha nativa (WhatsApp,
 * Telegram…); no computador abre o WhatsApp Web com o texto e o link.
 */
export function ShareButton({ text, title }: ShareButtonProps) {
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

  return (
    <Button variant="outline" onClick={share}>
      {shared ? <CheckIcon data-icon="inline-start" /> : <Share2Icon data-icon="inline-start" />}
      Compartilhar
    </Button>
  );
}
