import "server-only";

import { isDatabaseError } from "@/lib/db/errors";
import { isEAError, type EAErrorKind } from "@/lib/ea";
import { ConfigurationError } from "@/lib/env";

const EA_MESSAGES: Record<EAErrorKind, string> = {
  not_found: "Clube não encontrado na EA. Confira o nome (ou ID) e a plataforma.",
  timeout: "A EA demorou demais para responder. Tente novamente em instantes.",
  unavailable: "Os servidores da EA estão indisponíveis no momento. Tente novamente mais tarde.",
  blocked:
    "A EA não aceita conexões deste servidor. Os dados são atualizados automaticamente a cada 15 minutos.",
  rate_limited: "Muitas requisições à EA em pouco tempo. Aguarde um minuto e tente de novo.",
  invalid_response:
    "A EA retornou dados em um formato inesperado. A integração pode precisar de ajuste.",
  bad_request: "A EA recusou a busca. Verifique os dados informados.",
};

/**
 * Mensagem segura para exibir ao usuário. Nunca inclui stack trace nem
 * detalhes internos — esses vão apenas para o log do servidor.
 */
export function getUserMessage(error: unknown): string {
  if (isEAError(error)) return EA_MESSAGES[error.kind];
  if (isDatabaseError(error)) {
    return "Nosso banco de dados está indisponível no momento. Tente novamente em instantes.";
  }
  if (error instanceof ConfigurationError) {
    return "O servidor não está configurado corretamente. Verifique as variáveis de ambiente.";
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export function logServerError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}
