import "server-only";

import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { z } from "zod";

import { getClubById } from "@/lib/db/clubs.repository";
import type { Club } from "@/types/club";

const uuidSchema = z.uuid();

/**
 * Carrega o clube da rota (layout + páginas compartilham via React cache).
 * IDs inválidos ou inexistentes viram 404.
 */
export const loadClub = cache(async (clubId: string): Promise<Club> => {
  // Dados do banco mudam a cada sincronização: sempre renderizar na requisição.
  await connection();

  if (!uuidSchema.safeParse(clubId).success) notFound();
  const club = await getClubById(clubId);
  if (!club) notFound();
  return club;
});

export const isValidId = (value: string) => uuidSchema.safeParse(value).success;
