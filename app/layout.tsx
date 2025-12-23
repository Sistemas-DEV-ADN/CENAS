import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ChefHat } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hnos. Pienda - Sistema de Pedidos",
  description: "Sistema de gestión de pedidos para cenas navideñas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
          {/* Header */}
          <header className="bg-[var(--primary)] text-white">
            <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-center">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="bg-[var(--accent)] p-2 rounded-xl">
                  <ChefHat className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xl font-bold tracking-wide">Hnos. Pienda</span>
                  <span className="hidden sm:inline text-white/70 ml-2 text-sm">• Sistema de Pedidos</span>
                </div>
              </Link>
            </div>
          </header>

          {/* Main */}
          <main className="flex-1 px-6 py-10">
            <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-[var(--primary)] text-white/80 py-4 text-center text-sm">
            © 2024 Hnos. Pienda • Cenas Navideñas
          </footer>
        </div>
      </body>
    </html>
  );
}
