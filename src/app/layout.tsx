import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";

import { Header } from "@/components/layout/Header";
import { getSiteUrl } from "@/lib/site";

import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "FC Clubs Stats",
    template: "%s · FC Clubs Stats",
  },
  description:
    "Estatísticas, histórico de partidas e rankings de clubes do EA SPORTS FC 27 Pro Clubs.",
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1 pb-16">{children}</main>
        <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground max-md:pb-24">
          FC Clubs Stats · projeto independente, sem vínculo com a Electronic Arts
        </footer>
      </body>
    </html>
  );
}
