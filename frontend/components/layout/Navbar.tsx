"use client";
import Link from "next/link";
import { ShoppingCart, User, Store, LogOut, Truck, Shield, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout, hydrate } = useAuth();
  const items = useCart((s) => s.items);
  const router = useRouter();

  useEffect(() => { hydrate(); }, [hydrate]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary-600">
          TiendaRopa
        </Link>

        <div className="flex items-center gap-4">
          {user?.role === "seller" && (
            <>
              <Link href="/vendedor" className="flex items-center gap-1 text-gray-600 hover:text-primary-600">
                <Store size={20} />
                <span className="text-sm">Mi tienda</span>
              </Link>
              <Link href="/vendedor/envios" className="flex items-center gap-1 text-gray-600 hover:text-primary-600">
                <Truck size={20} />
                <span className="text-sm">Envíos</span>
              </Link>
            </>
          )}

          <Link href="/carrito" className="relative flex items-center gap-1 text-gray-600 hover:text-primary-600">
            <ShoppingCart size={20} />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "admin" && (
                <Link href="/admin" className="flex items-center gap-1 text-purple-600 hover:text-purple-800">
                  <Shield size={18} />
                  <span className="text-sm font-medium">Admin</span>
                </Link>
              )}
              <Link href="/perfil/favoritos" className="text-gray-400 hover:text-red-500 transition-colors" title="Favoritos">
                <Heart size={20} />
              </Link>
              <Link href="/mensajes" className="text-gray-400 hover:text-primary-600 transition-colors" title="Mensajes">
                <MessageCircle size={20} />
              </Link>
              <Link href="/perfil/ordenes" className="flex items-center gap-1 text-gray-600 hover:text-primary-600">
                <User size={20} />
                <span className="text-sm">{user.full_name.split(" ")[0]}</span>
              </Link>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="btn-secondary text-sm py-1.5 px-3">
                Iniciar sesión
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm py-1.5 px-3">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
