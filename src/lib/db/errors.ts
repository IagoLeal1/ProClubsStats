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

/** O Supabase limita cada resposta a 1000 linhas por padrão. */
const PAGE_SIZE = 1000;

/**
 * Busca todas as páginas de uma consulta (o histórico cresce sem limite).
 * `fetchPage` precisa ter ordenação estável para a paginação não pular linhas.
 */
export async function fetchAllPages<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: PostgrestLikeError | null }>,
  operation: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = unwrap(await fetchPage(from, from + PAGE_SIZE - 1), operation);
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}
