import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/sou-comercio", destination: "/parceiro", permanent: true },
      { source: "/sou-pousada", destination: "/parceiro", permanent: true },
      { source: "/sou-operador", destination: "/parceiro", permanent: true },
      { source: "/sou-motorista", destination: "/entregador", permanent: true },

      { source: "/lojista", destination: "/parceiro/painel", permanent: false },
      { source: "/lojista/:path*", destination: "/parceiro/painel/:path*", permanent: false },
      { source: "/comercio", destination: "/parceiro", permanent: false },
      { source: "/motoboy", destination: "/entregador/painel", permanent: false },
      { source: "/motoboy/:path*", destination: "/entregador/painel/:path*", permanent: false },
      { source: "/motorista", destination: "/entregador/painel", permanent: false },

      { source: "/cliente", destination: "/", permanent: true },
      { source: "/cliente/:path*", destination: "/app/:path*", permanent: true },

      { source: "/admin", destination: "/super-admin", permanent: false },
      { source: "/admin/:path*", destination: "/super-admin/:path*", permanent: false },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: false, deleteSourcemapsAfterUpload: true },
  disableLogger: true,
  automaticVercelMonitors: true,
  tunnelRoute: "/monitoring",
});
