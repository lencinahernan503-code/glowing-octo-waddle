"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, Package, ShoppingBag, ChevronRight, Shield,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/usuarios", label: "Usuarios", icon: <Users size={18} /> },
  { href: "/admin/productos", label: "Productos", icon: <Package size={18} /> },
  { href: "/admin/ordenes", label: "Órdenes", icon: <ShoppingBag size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrate } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user !== null && user?.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary-400" />
            <span className="font-bold text-lg">Admin</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{user.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-gray-700">
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">
            ← Volver a la tienda
          </Link>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
