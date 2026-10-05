interface PostgrestLikeError {
  message: string;
  code?: string;
}

export class DatabaseError extends Error {
  readonly code: string | null;

  constructor(operation: string, cause: PostgrestLikeError) {
    super(`Falha no banco ao ${operation}: ${cause.message}`, { cause });
    this.name = "DatabaseError";
    this.code = cause.code ?? null;
  }
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/** Converte o retorno `{ data, error }` do Supabase em valor ou exceção. */
export function unwrap<T>(
  response: { data: T; error: PostgrestLikeError | null },
  operation: string,
): NonNullable<T> {
  if (response.error) throw new DatabaseError(operation, response.error);
  if (response.data === null || response.data === undefined) {
    throw new DatabaseError(operation, { message: "resposta vazia" });
  }
  return response.data;
}

/** Igual a `unwrap`, mas aceita ausência de linha (ex.: `.maybeSingle()`). */
export function unwrapMaybe<T>(
  response: { data: T; error: PostgrestLikeError | null },
  operation: string,
): T | null {
  if (response.error) throw new DatabaseError(operation, response.error);
  return response.data;
}

/** Para escritas sem retorno de linhas. */
export function assertOk(
  response: { error: PostgrestLikeError | null },
  operation: string,
): void {
  if (response.error) throw new DatabaseError(operation, response.error);
}
