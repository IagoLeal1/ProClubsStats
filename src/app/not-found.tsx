import Link from "next/link";
import { SearchXIcon } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/layout/EmptyState";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="pt-16">
      <EmptyState
        icon={SearchXIcon}
        title="Página não encontrada"
        description="O clube ou a página que você procura não existe aqui. Pesquise o clube para sincronizá-lo com a EA."
      >
        <Link href="/" className={buttonVariants()}>
          Pesquisar clube
        </Link>
      </EmptyState>
    </Container>
  );
}
