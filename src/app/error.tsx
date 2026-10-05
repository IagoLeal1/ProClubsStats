"use client";

import { Container } from "@/components/layout/Container";
import { ErrorMessage } from "@/components/layout/ErrorMessage";

export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Container className="pt-16">
      <ErrorMessage onRetry={retry} title="Algo deu errado" />
    </Container>
  );
}
