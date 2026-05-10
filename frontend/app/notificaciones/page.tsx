"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Bell, ShoppingBag, MessageCircle, Tag, CheckCheck } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const icons: Record<string, React.ReactNode> = {
  message: <MessageCircle size={18} className="text-blue-500" />,
  sale: <ShoppingBag size={18} className="text-green-500" />,
  offer: <Tag size={18} className="text-orange-500" />,
  offer_response: <Tag size={18} className="text-purple-500" />,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    api.get("/notifications/").then(({ data }) => {
      setNotifs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const markRead = async (n: Notification) => {
    if (!n.is_read) {
      await api.patch(`/notifications/${n.id}/read`).catch(() => {});
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.link) router.push(n.link);
  };

  const markAllRead = async () => {
    await api.patch("/notifications/read-all").catch(() => {});
    setNotifs(prev => prev.map(x => ({ ...x, is_read: true })));
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Notificaciones</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-primary-600 font-medium">
            <CheckCheck size={16} />
            Marcar todo como leído
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 gap-4 text-gray-400">
          <Bell size={48} strokeWidth={1.5} />
          <p className="text-sm">No tenés notificaciones</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {notifs.map(n => (
            <li key={n.id}>
              <button
                onClick={() => markRead(n)}
                className={`w-full text-left px-4 py-4 flex items-start gap-3 transition-colors ${
                  n.is_read ? "bg-white" : "bg-primary-50"
                }`}
              >
                <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {icons[n.type] ?? <Bell size={18} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.is_read ? "text-gray-700" : "text-gray-900 font-semibold"}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
