/**
 * URL pública do site (prévias de link no WhatsApp exigem URL absoluta).
 * Ordem: NEXT_PUBLIC_SITE_URL → domínio de produção da Vercel → localhost.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return new URL(`https://${vercelProduction}`);

  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
