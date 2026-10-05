"use client";

import { CloudAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { EmptyState } from "./EmptyState";

interface ErrorMessageProps {
  onRetry: () => void;
  title?: string;
}

/**
 * Mensagem genérica para error boundaries. Em produção o Next.js não envia
 * detalhes de erros do servidor ao browser — e não queremos exibi-los.
 */
export function ErrorMessage({ onRetry, title = "Não foi possível carregar os dados" }: ErrorMessageProps) {
  return (
    <EmptyState
      icon={CloudAlertIcon}
      title={title}
      description="O banco de dados ou a EA podem estar instáveis no momento. Tente novamente em instantes."
    >
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </EmptyState>
  );
}
