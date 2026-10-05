"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface ClubCrestProps {
  name: string;
  src: string | null;
  size?: number;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Escudo do clube com fallback para as iniciais se a imagem falhar. */
export function ClubCrest({ name, src, size = 40, className }: ClubCrestProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.32) }}
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-secondary font-semibold text-muted-foreground",
          className,
        )}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      // Escudos já vêm em 256px da CDN da EA; não gastamos otimização da Vercel.
      unoptimized
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
