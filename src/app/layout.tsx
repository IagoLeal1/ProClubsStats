import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Header } from "@/components/layout/Header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FC Clubs Stats",
    template: "%s · FC Clubs Stats",
  },
  description:
    "Estatísticas, histórico de partidas e rankings de clubes do EA SPORTS FC 27 Pro Clubs.",
};

export const viewport: Viewport = {
  themeColor: "#14171f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1 pb-16">{children}</main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          FC Clubs Stats · projeto independente, sem vínculo com a Electronic Arts.
        </footer>
      </body>
    </html>
  );
}
