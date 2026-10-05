import "server-only";

import { z } from "zod";

import { getEAEnv } from "@/lib/env";

import { EA_DEFAULT_BASE_URL } from "./constants";
import { EAError, isEAError } from "./errors";

type QueryParams = Record<string, string | number>;

export interface EAClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  /** Tentativas extras para erros transitórios (timeout, 5xx, 429, rede). */
  maxRetries?: number;
  retryDelayMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * A API fica atrás do Akamai: requisições sem cabeçalhos de navegador
 * recebem 403. Estes são os mínimos que funcionaram nos testes.
 */
const DEFAULT_HEADERS: HeadersInit = {
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Referer: "https://www.ea.com/",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

/** A EA responde 500 com "CLUBS_ERR_INVALID_CLUB_ID" para clubes inexistentes. */
function looksLikeInvalidClub(body: string): boolean {
  return body.includes("INVALID_CLUB_ID");
}

function errorFromStatus(status: number, body: string, endpoint: string): EAError {
  const options = { endpoint, status };

  if (status === 400) {
    return new EAError("bad_request", `EA rejeitou os parâmetros (${status})`, options);
  }
  if (status === 403) {
    return new EAError("blocked", "EA bloqueou a requisição (403)", options);
  }
  if (status === 404) {
    // Rota inexistente: provavelmente o endpoint mudou. Não adianta repetir.
    return new EAError("unavailable", "Endpoint da EA não encontrado (404)", {
      ...options,
      retryable: false,
    });
  }
  if (status === 429) {
    return new EAError("rate_limited", "Limite de requisições da EA (429)", options);
  }
  if (status >= 500 && looksLikeInvalidClub(body)) {
    return new EAError("not_found", "Clube não encontrado na EA", options);
  }
  return new EAError("unavailable", `EA indisponível (${status})`, options);
}

export class EAClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: EAClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? EA_DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 500;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /** GET + parse JSON + validação com o schema informado, com retries simples. */
  async get<Schema extends z.ZodType>(
    endpoint: string,
    params: QueryParams,
    schema: Schema,
  ): Promise<z.output<Schema>> {
    const url = this.buildUrl(endpoint, params);

    for (let attempt = 0; ; attempt++) {
      try {
        const body = await this.request(url, endpoint);
        return this.validate(body, schema, endpoint);
      } catch (error) {
        const eaError = isEAError(error)
          ? error
          : new EAError("unavailable", "Erro inesperado ao acessar a EA", {
              endpoint,
              cause: error,
            });

        if (!eaError.retryable || attempt >= this.maxRetries) throw eaError;
        await sleep(this.retryDelayMs * (attempt + 1));
      }
    }
  }

  private buildUrl(endpoint: string, params: QueryParams): URL {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
    return url;
  }

  private async request(url: URL, endpoint: string): Promise<unknown> {
    let status: number;
    let ok: boolean;
    let text: string;

    try {
      const response = await this.fetchImpl(url, {
        headers: DEFAULT_HEADERS,
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      status = response.status;
      ok = response.ok;
      text = await response.text();
    } catch (error) {
      if (isTimeoutError(error)) {
        throw new EAError("timeout", `EA não respondeu em ${this.timeoutMs}ms`, {
          endpoint,
          cause: error,
        });
      }
      throw new EAError("unavailable", "Falha de rede ao acessar a EA", {
        endpoint,
        cause: error,
      });
    }

    if (!ok) throw errorFromStatus(status, text, endpoint);

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new EAError("invalid_response", "Resposta da EA não é JSON", {
        endpoint,
        status,
        cause: error,
      });
    }
  }

  private validate<Schema extends z.ZodType>(
    body: unknown,
    schema: Schema,
    endpoint: string,
  ): z.output<Schema> {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new EAError(
        "invalid_response",
        `Formato inesperado em ${endpoint}: ${z.prettifyError(result.error)}`,
        { endpoint, cause: result.error },
      );
    }
    return result.data;
  }
}

let sharedClient: EAClient | undefined;

export function getEAClient(): EAClient {
  sharedClient ??= new EAClient({ baseUrl: getEAEnv().EA_API_BASE_URL });
  return sharedClient;
}
