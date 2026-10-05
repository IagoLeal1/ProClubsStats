import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { ClubSearchForm } from "@/components/clubs/ClubSearchForm";
import { buttonVariants } from "@/components/ui/button";

import { Container } from "./Container";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <Container className="flex h-14 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-black text-primary-foreground">
            FC
          </span>
          <span>
            Clubs <span className="text-primary">Stats</span>
          </span>
        </Link>

        <div className="ml-auto hidden w-full max-w-sm md:block">
          <ClubSearchForm variant="compact" />
        </div>

        <Link
          href="/"
          aria-label="Pesquisar clube"
          className={buttonVariants({ variant: "ghost", size: "icon", className: "ml-auto md:hidden" })}
        >
          <SearchIcon />
        </Link>
      </Container>
    </header>
  );
}
