"use client";

import "./globals.css";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="grid min-h-screen place-items-center p-6 text-center">
        <title>Erro · FC Clubs Stats</title>
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">Tente novamente em instantes.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
