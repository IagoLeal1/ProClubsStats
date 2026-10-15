"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface NavSection {
  id: string;
  label: string;
}

/** Atalhos fixos abaixo do cabeçalho, marcando a seção que está na tela. */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      // Conta como "na tela" a seção que cruza a faixa logo abaixo dos atalhos.
      { rootMargin: "-130px 0px -55% 0px" },
    );
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sections]);

  // No celular a lista rola de lado: mantém o atalho ativo à vista.
  useEffect(() => {
    const list = listRef.current;
    const link = list?.querySelector<HTMLElement>(`[data-section="${active}"]`);
    if (!list || !link) return;
    list.scrollTo({ left: link.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label="Seções da página"
      className="sticky top-16 z-30 -mx-4 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75 sm:-mx-6"
    >
      <ul ref={listRef} className="no-scrollbar flex gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              data-section={section.id}
              aria-current={section.id === active ? "location" : undefined}
              className={cn(
                "block rounded-full px-3 py-1.5 font-display text-sm font-bold tracking-[0.06em] whitespace-nowrap uppercase transition-colors",
                section.id === active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
