import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vendi - Tu estilo, tu precio",
  description: "La comunidad donde todos pueden vender y encontrar lo que aman",
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
