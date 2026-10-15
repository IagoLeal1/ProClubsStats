import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    // Página estática da arquitetura (public/arquitetura.html) num endereço curto.
    return [{ source: "/arquitetura", destination: "/arquitetura.html" }];
  },
};

export default nextConfig;
