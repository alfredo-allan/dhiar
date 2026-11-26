import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança em todas as páginas da loja:
 * - não deixa outro site embutir a loja num iframe (golpe de "clickjacking");
 * - o navegador não "adivinha" tipos de arquivo;
 * - links externos não recebem o endereço completo de onde o cliente veio;
 * - câmera, microfone e localização ficam bloqueados;
 * - HTTPS obrigatório depois da primeira visita (só em produção).
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
