import type { Metadata } from "next";

import { ClubHeader } from "@/components/clubs/ClubHeader";
import { ClubNav } from "@/components/clubs/ClubNav";
import { Container } from "@/components/layout/Container";

import { loadClub } from "./load-club";

export async function generateMetadata({
  params,
}: LayoutProps<"/clubs/[clubId]">): Promise<Metadata> {
  const { clubId } = await params;
  const club = await loadClub(clubId);
  return {
    title: {
      default: club.name,
      template: `%s · ${club.name} · FC Clubs Stats`,
    },
  };
}

export default async function ClubLayout({ children, params }: LayoutProps<"/clubs/[clubId]">) {
  const { clubId } = await params;
  const club = await loadClub(clubId);

  return (
    <Container className="space-y-6 pt-6 sm:pt-8">
      <ClubHeader club={club} />
      <ClubNav clubId={club.id} />
      {children}
    </Container>
  );
}
