import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RegistroPwa } from '@/componentes/globais/registro-pwa';
export const metadata: Metadata = {
  title: { default: 'On Contabilidade', template: '%s | On Contabilidade' },
  description: 'Gestão contábil e financeira da On Contabilidade',
  applicationName: 'On ERP',
  icons: { icon: '/icons/on-erp.svg' },
};
export const viewport: Viewport = { themeColor: '#0A111C', width: 'device-width', initialScale: 1 };
export default function LayoutRaiz({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}<RegistroPwa/></body></html>;
}
