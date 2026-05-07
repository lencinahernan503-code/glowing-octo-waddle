"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Package, Search } from "lucide-react";

interface Conversation {
  other_user_id: number;
  other_user_name: string;
  product_id: number | null;
  product_title: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export default function MessagesPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/messages/conversations")
      .then(({ data }) => setConvs(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Mensajes</h1>
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
          <Search size={15} className="text-gray-400" />
          <span className="text-sm text-gray-400">Buscar conversación...</span>
        </div>
      </div>

      <div className="px-4 pt-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : convs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">💬</p>
            <p className="text-gray-500 font-medium">No tenés conversaciones aún</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Encontrá un producto y tocá "Consultar al vendedor"</p>
            <Link href="/explorar" className="bg-primary-600 text-white font-bold px-6 py-3 rounded-2xl text-sm inline-block">
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {convs.map((c) => {
              const href = `/mensajes/${c.other_user_id}${c.product_id ? `?product=${c.product_id}` : ""}`;
              const initials = c.other_user_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Link key={`${c.other_user_id}-${c.product_id}`} href={href}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-base shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 truncate text-sm">{c.other_user_name}</p>
                      <p className="text-xs text-gray-400 shrink-0">
                        {new Date(c.last_message_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {c.product_title && (
                      <div className="flex items-center gap-1 text-xs text-primary-600 mb-0.5">
                        <Package size={10} />
                        <span className="truncate">{c.product_title}</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-400 truncate">{c.last_message}</p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
