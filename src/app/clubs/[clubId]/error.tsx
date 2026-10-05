"use client";

import { ErrorMessage } from "@/components/layout/ErrorMessage";

export default function ClubSectionError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorMessage onRetry={retry} />;
}
