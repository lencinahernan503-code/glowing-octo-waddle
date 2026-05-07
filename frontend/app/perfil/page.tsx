"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  ShoppingBag, Heart, Settings, HelpCircle, LogOut,
  ChevronRight, Star, Shield, Store, Truck, Tag, Package, TrendingUp
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout, hydrate } = useAuth();
  const router = useRouter();

  useEffect(() => { hydrate(); }, [hydrate]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6">
          <span className="text-5xl">👤</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Tu perfil</h2>
        <p className="text-gray-400 text-center mb-8">Iniciá sesión para ver tus compras, favoritos y más</p>
        <Link href="/auth/login" className="btn-primary mb-3">Iniciar sesión</Link>
        <Link href="/auth/register" className="btn-secondary">Crear cuenta gratis</Link>
      </div>
    );
  }

  const initials = user.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const menuItems = [
    { href: "/perfil/ordenes", icon: ShoppingBag, label: "Mis compras", color: "text-blue-500", bg: "bg-blue-50" },
    { href: "/ofertas", icon: Tag, label: "Mis ofertas", color: "text-primary-600", bg: "bg-primary-50" },
    { href: "/perfil/favoritos", icon: Heart, label: "Favoritos", color: "text-red-500", bg: "bg-red-50" },
    ...(user.role === "buyer" ? [
      { href: "/perfil/ser-vendedor", icon: TrendingUp, label: "Quiero vender", color: "text-primary-600", bg: "bg-primary-50" },
    ] : []),
    ...(user.role === "seller" ? [
      { href: "/vendedor", icon: Store, label: "Mi tienda", color: "text-primary-600", bg: "bg-primary-50" },
      { href: "/vendedor/ventas", icon: Package, label: "Mis ventas", color: "text-green-600", bg: "bg-green-50" },
      { href: "/suscripcion", icon: TrendingUp, label: "Mi suscripción", color: "text-violet-600", bg: "bg-violet-50" },
      { href: "/vendedor/envios", icon: Truck, label: "Envíos", color: "text-orange-500", bg: "bg-orange-50" },
    ] : []),
    ...(user.role === "admin" ? [
      { href: "/admin", icon: Shield, label: "Panel Admin", color: "text-purple-600", bg: "bg-purple-50" },
    ] : []),
    { href: "#", icon: Settings, label: "Configuración", color: "text-gray-500", bg: "bg-gray-100" },
    { href: "#", icon: HelpCircle, label: "Ayuda", color: "text-gray-500", bg: "bg-gray-100" },
  ];

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Perfil</h1>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Settings size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-primary-200">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-gray-900">{user.full_name}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>
            <span className="inline-block mt-1 text-xs bg-primary-100 text-primary-700 font-semibold px-2.5 py-0.5 rounded-full capitalize">
              {user.role === "buyer" ? "Comprador" : user.role === "seller" ? "Vendedor" : "Admin"}
            </span>
          </div>
          {user.role === "seller" && (
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-sm text-gray-800">4.8</span>
              </div>
              <p className="text-xs text-gray-400">reputación</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pt-4 space-y-2">
        {menuItems.map(({ href, icon: Icon, label, color, bg }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl p-4 flex items-center gap-4 active:bg-gray-50 transition-colors">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <span className="flex-1 font-semibold text-gray-800 text-sm">{label}</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 active:bg-gray-50 transition-colors mt-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <LogOut size={20} className="text-red-500" />
          </div>
          <span className="flex-1 font-semibold text-red-500 text-sm text-left">Cerrar sesión</span>
        </button>
      </div>

      <p className="text-center text-xs text-gray-300 mt-6 pb-4">Vendi v1.0 · Tu estilo, tu precio</p>
    </div>
  );
}
