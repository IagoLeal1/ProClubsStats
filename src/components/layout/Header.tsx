import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { ClubSearchForm } from "@/components/clubs/ClubSearchForm";
import { buttonVariants } from "@/components/ui/button";

import { Container } from "./Container";

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="clip-slant flex h-8 items-center px-4 font-display text-xl font-extrabold text-primary-foreground italic bg-primary">
        FC
      </span>
      <span className="font-display text-xl font-bold tracking-[0.1em]">CLUBS STATS</span>
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" aria-label="FC Clubs Stats — início" className="shrink-0">
          <Logo />
        </Link>

        <div className="ml-auto hidden w-full max-w-sm md:block">
          <ClubSearchForm variant="compact" />
        </div>

        <Link
          href="/"
          aria-label="Pesquisar clube"
          className={buttonVariants({ variant: "ghost", size: "icon-lg", className: "ml-auto md:hidden" })}
        >
          <SearchIcon />
        </Link>
      </Container>
    </header>
  );
}
