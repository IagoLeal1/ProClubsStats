import { SearchXIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/EmptyState";

export default function ClubSectionNotFound() {
  return (
    <EmptyState
      icon={SearchXIcon}
      title="Não encontrado"
      description="Este item não existe no histórico deste clube."
    />
  );
}
