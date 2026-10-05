/**
 * O banco guarda enums como text (com CHECK constraints). Estas funções
 * convertem o valor lido para o tipo de domínio sem usar casts.
 */
export function parseEnumOrNull<T extends string>(
  values: readonly T[],
  value: string | null,
): T | null {
  return values.find((candidate) => candidate === value) ?? null;
}

export function parseEnum<T extends string>(
  values: readonly T[],
  value: string | null,
  fallback: T,
): T {
  return parseEnumOrNull(values, value) ?? fallback;
}
