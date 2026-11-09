import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onfin",
  description: "Gestão financeira On Contabilidade",
  icons: {
    icon: [
      { url: "/onfin-app-icon.svg?v=2", type: "image/svg+xml" },
      { url: "/onfin-icon.ico?v=2", sizes: "any" },
      { url: "/onfin-icon-32.png?v=2", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/onfin-icon-180.png?v=2", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Onfin",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
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
        <meta name="apple-mobile-web-app-title" content="Onfin" />
        <meta name="msapplication-TileColor" content="#0A0A0A" />
        <meta name="msapplication-TileImage" content="/onfin-icon-144.png?v=2" />
        <link rel="icon" href="/onfin-icon.ico?v=2" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/onfin-app-icon.svg?v=2" />
        <link rel="apple-touch-icon" href="/onfin-icon-180.png?v=2" />
      </head>
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
