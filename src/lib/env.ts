import "server-only";

import { z } from "zod";

/**
 * Variáveis de ambiente validadas sob demanda (e não no import), para que o
 * build e páginas que não dependem de uma integração não falhem sem ela.
 */

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/** `VAR=` vazio no .env conta como não definido. */
const optional = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const eaEnvSchema = z.object({
  EA_API_BASE_URL: optional(z.url()),
});

const githubEnvSchema = z.object({
  /** Token (fine-grained) com permissão "Actions: write" neste repositório. */
  GITHUB_DISPATCH_TOKEN: optional(z.string().min(20)),
  /** "dono/repositório". Na Vercel vem de VERCEL_GIT_REPO_OWNER/SLUG. */
  GITHUB_REPOSITORY: optional(z.string().regex(/^[\w.-]+\/[\w.-]+$/)),
  VERCEL_GIT_REPO_OWNER: optional(z.string()),
  VERCEL_GIT_REPO_SLUG: optional(z.string()),
});

function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  scope: string,
): z.output<Schema> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    // Lista apenas os nomes das variáveis, nunca os valores.
    const keys = result.error.issues.map((issue) => issue.path.join("."));
    throw new ConfigurationError(
      `Variáveis de ambiente inválidas ou ausentes (${scope}): ${keys.join(", ")}`,
    );
  }
  return result.data;
}

let supabaseEnv: z.output<typeof supabaseEnvSchema> | undefined;
let eaEnv: z.output<typeof eaEnvSchema> | undefined;

export function getSupabaseEnv() {
  supabaseEnv ??= parseEnv(supabaseEnvSchema, "Supabase");
  return supabaseEnv;
}

export function getEAEnv() {
  eaEnv ??= parseEnv(eaEnvSchema, "EA");
  return eaEnv;
}

/** Configuração para pedir sincronizações ao GitHub Actions (ou null). */
export function getGitHubDispatchConfig(): { token: string; repository: string } | null {
  const env = parseEnv(githubEnvSchema, "GitHub");
  const repository =
    env.GITHUB_REPOSITORY ??
    (env.VERCEL_GIT_REPO_OWNER && env.VERCEL_GIT_REPO_SLUG
      ? `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}`
      : undefined);
  return env.GITHUB_DISPATCH_TOKEN && repository
    ? { token: env.GITHUB_DISPATCH_TOKEN, repository }
    : null;
}
