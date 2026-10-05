import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export type DbClient = SupabaseClient<Database>;

const options = {
  auth: { persistSession: false, autoRefreshToken: false },
} as const;

let readerClient: DbClient | undefined;
let adminClient: DbClient | undefined;

/** Leitura pública (anon key + RLS somente-select). */
export function getDbReader(): DbClient {
  const env = getSupabaseEnv();
  readerClient ??= createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options,
  );
  return readerClient;
}

/**
 * Escrita com service role (ignora RLS). Usado apenas pela sincronização no
 * servidor — "server-only" impede que este módulo chegue ao bundle do browser.
 */
export function getDbAdmin(): DbClient {
  const env = getSupabaseEnv();
  adminClient ??= createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    options,
  );
  return adminClient;
}
