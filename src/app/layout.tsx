import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RegistroPwa } from '@/componentes/globais/registro-pwa';
export const metadata: Metadata = {
  title: { default: 'On Contabilidade', template: '%s | On Contabilidade' },
  description: 'Gestão contábil e financeira da On Contabilidade',
  applicationName: 'On ERP',
  icons: { icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/icons/on-erp.svg', type: 'image/svg+xml' }], apple: '/icons/apple-touch-icon.png' },
};
export const viewport: Viewport = { themeColor: '#0A111C', width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function LayoutRaiz({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}<RegistroPwa/></body></html>;
}
