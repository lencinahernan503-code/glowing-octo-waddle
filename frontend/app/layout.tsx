import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Feriant", template: "%s | Feriant" },
  description: "La comunidad de moda donde todos pueden vender y encontrar lo que aman. Ropa, accesorios y más.",
  keywords: ["feriant", "ropa", "marketplace", "moda", "argentina", "comprar ropa", "vender ropa"],
  authors: [{ name: "Feriant" }],
  creator: "Feriant",
  metadataBase: new URL("https://frontend-production-df10b.up.railway.app"),
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://frontend-production-df10b.up.railway.app",
    siteName: "Feriant",
    title: "Feriant — Tu estilo, tu precio",
    description: "La comunidad de moda donde todos pueden vender y encontrar lo que aman.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Feriant" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feriant — Tu estilo, tu precio",
    description: "La comunidad de moda donde todos pueden vender y encontrar lo que aman.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <main className="min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
