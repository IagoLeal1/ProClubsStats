import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, PLATFORMS, type Platform } from "@/types/club";

interface ClubSearchFormProps {
  variant?: "hero" | "compact";
  defaultQuery?: string;
  defaultPlatform?: Platform;
}

/** Formulário GET para /search — funciona sem JavaScript. */
export function ClubSearchForm({
  variant = "hero",
  defaultQuery = "",
  defaultPlatform = "crossplay",
}: ClubSearchFormProps) {
  const isHero = variant === "hero";

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className={cn("flex w-full gap-2", isHero && "flex-col sm:flex-row")}
    >
      <label htmlFor={`club-search-${variant}`} className="sr-only">
        Nome ou ID do clube
      </label>
      <div className="relative flex-1">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={`club-search-${variant}`}
          name="q"
          type="search"
          required
          minLength={2}
          maxLength={60}
          defaultValue={defaultQuery}
          placeholder={isHero ? "Pesquise seu clube" : "Pesquisar clube"}
          autoComplete="off"
          className={cn("pl-9", isHero && "h-11 text-base")}
        />
      </div>

      {isHero ? (
        <>
          <label htmlFor="club-search-platform" className="sr-only">
            Plataforma
          </label>
          <select
            id="club-search-platform"
            name="platform"
            defaultValue={defaultPlatform}
            className="h-11 rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {PLATFORM_LABELS[platform]}
              </option>
            ))}
          </select>
          <Button type="submit" className="h-11 px-5 text-sm">
            Pesquisar
          </Button>
        </>
      ) : (
        <input type="hidden" name="platform" value={defaultPlatform} />
      )}
    </form>
  );
}
