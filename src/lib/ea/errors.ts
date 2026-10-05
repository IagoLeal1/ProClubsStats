export type EAErrorKind =
  | "not_found"
  | "timeout"
  | "unavailable"
  | "blocked"
  | "rate_limited"
  | "invalid_response"
  | "bad_request";

const RETRYABLE_KINDS: ReadonlySet<EAErrorKind> = new Set([
  "timeout",
  "unavailable",
  "rate_limited",
]);

interface EAErrorOptions {
  endpoint: string;
  status?: number;
  retryable?: boolean;
  cause?: unknown;
}

export class EAError extends Error {
  readonly kind: EAErrorKind;
  readonly endpoint: string;
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(kind: EAErrorKind, message: string, options: EAErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "EAError";
    this.kind = kind;
    this.endpoint = options.endpoint;
    this.status = options.status ?? null;
    this.retryable = options.retryable ?? RETRYABLE_KINDS.has(kind);
  }
}

export function isEAError(error: unknown): error is EAError {
  return error instanceof EAError;
}

export function isEANotFound(error: unknown): boolean {
  return isEAError(error) && error.kind === "not_found";
}
