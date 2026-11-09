import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "On Finanças",
  description: "Gestão Financeira On Contabilidade",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "On Finanças",
  },
};

export const viewport: Viewport = {
  themeColor: "#161616",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="On Finanças" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
