"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function useUnreadMessages(userId: number | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const fetch = () =>
      api.get("/messages/conversations")
        .then(({ data }) => {
          const total = data.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
          setCount(total);
        })
        .catch(() => {});
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return count;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const cartCount = useCart((s) => s.items.length);
  const unread = useUnreadMessages(user?.id);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/explorar", icon: Search, label: "Explorar" },
    { href: user?.role === "seller" ? "/vendedor/nuevo" : "/auth/login", icon: Plus, label: "Vender", isCenter: true },
    { href: "/mensajes", icon: MessageCircle, label: "Mensajes", badge: unread },
    { href: "/perfil", icon: User, label: "Perfil", badge: cartCount > 0 && pathname !== "/carrito" ? cartCount : 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label, isCenter, badge }) => {
          if (isCenter) {
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center justify-center -mt-5">
                <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200">
                  <Icon size={26} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="text-xs text-gray-400 mt-1">{label}</span>
              </Link>
            );
          }
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1">
              <div className="relative">
                <Icon size={22} className={active ? "text-primary-600" : "text-gray-400"} strokeWidth={active ? 2.5 : 2} />
                {!!badge && (
                  <span className="absolute -top-1 -right-1.5 bg-primary-600 text-white text-[9px] rounded-full min-w-[14px] h-3.5 flex items-center justify-center font-bold px-0.5">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium ${active ? "text-primary-600" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
