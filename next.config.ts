import type { NextConfig } from 'next';
const configuracao: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
};
export default configuracao;
