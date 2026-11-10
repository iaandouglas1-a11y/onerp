import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'On ERP — On Contabilidade', short_name: 'On ERP', description: 'Gestão interna da On Contabilidade',
    start_url: '/inicio', display: 'standalone', background_color: '#F4F6F8', theme_color: '#0A111C',
    icons: [
      { src: '/icons/on-erp-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/on-erp-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/on-erp-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/on-erp-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/on-erp.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
