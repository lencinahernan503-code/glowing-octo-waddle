"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Send, Package, CheckCheck, Check } from "lucide-react";
import { Product } from "@/types";

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  receiver_id: number;
  receiver_name?: string;
  content: string;
  is_read: boolean;
  product_id: number | null;
  product_title: string | null;
  created_at: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function ChatContent() {
  const { userId } = useParams();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const { user, hydrate } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => { hydrate(); }, [hydrate]);

  // Cargar producto si hay productId
  useEffect(() => {
    if (!productId) return;
    api.get(`/products/${productId}`)
      .then(({ data }) => setProduct(data))
      .catch(() => {});
  }, [productId]);

  const load = async () => {
    if (!user) return;
    try {
      const params: Record<string, string> = {};
      if (productId) params.product_id = productId;
      const { data } = await api.get(`/messages/with/${userId}`, { params });
      setMessages(data);
      if (data.length > 0) {
        const m = data[0];
        const name = m.sender_id === user.id
          ? (m.receiver_name || `Usuario #${userId}`)
          : m.sender_name;
        setOtherName(name);
      }
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [user, userId, productId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: Date.now(),
      sender_id: user!.id,
      sender_name: user!.full_name,
      receiver_id: Number(userId),
      content: text.trim(),
      is_read: false,
      product_id: productId ? Number(productId) : null,
      product_title: product?.title || null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    try {
      await api.post("/messages", {
        receiver_id: Number(userId),
        content: optimistic.content,
        product_id: productId ? Number(productId) : null,
      });
      load();
    } finally {
      setSending(false);
    }
  };

  const initials = otherName
    ? otherName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const mainImg = product?.images.find((i) => i.is_main) || product?.images[0];

  return (
    <div className="max-w-lg mx-auto bg-white flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-3 flex items-center gap-3 shrink-0 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-500 shrink-0">
          <ArrowLeft size={22} />
        </button>
        <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">
            {otherName || `Usuario #${userId}`}
          </p>
          <p className="text-xs text-green-500 font-medium">En línea</p>
        </div>
      </div>

      {/* Banner del producto */}
      {product && (
        <Link href={`/productos/${product.id}`}
          className="flex items-center gap-3 px-4 py-2.5 bg-primary-50 border-b border-primary-100 shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0 bg-gray-100">
            {mainImg ? (
              <Image src={`${API}${mainImg.url}`} alt={product.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">👗</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary-700 truncate">{product.title}</p>
            <p className="text-xs text-primary-500 font-semibold">
              ${product.price.toLocaleString("es-AR")}
              <span className="ml-2 text-primary-400 font-normal capitalize">· {product.condition}</span>
            </p>
          </div>
          <Package size={14} className="text-primary-400 shrink-0" />
        </Link>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="font-bold text-gray-700 mb-1">
              {product ? `Preguntá sobre ${product.title}` : "Iniciá la conversación"}
            </p>
            <p className="text-gray-400 text-sm">
              {product
                ? "Consultá talle, precio o cualquier detalle al vendedor"
                : "Escribí tu primer mensaje"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((m, i) => {
              const mine = m.sender_id === user?.id;
              const prev = messages[i - 1];
              const next = messages[i + 1];

              const showDate = !prev || !isSameDay(prev.created_at, m.created_at);
              const isFirstInGroup = !prev || prev.sender_id !== m.sender_id || showDate;
              const isLastInGroup = !next || next.sender_id !== m.sender_id || !isSameDay(m.created_at, next.created_at);

              return (
                <div key={m.id}>
                  {/* Separador de fecha */}
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-gray-200 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
                        {formatDateLabel(m.created_at)}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                    {/* Avatar del otro (solo en el último de un grupo) */}
                    {!mine && (
                      <div className={`w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 ${isLastInGroup ? "opacity-100" : "opacity-0"}`}>
                        {initials}
                      </div>
                    )}

                    <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`px-3.5 py-2.5 ${
                        mine
                          ? `bg-primary-600 text-white ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-lg"} rounded-bl-2xl ${isLastInGroup ? "rounded-br-sm" : "rounded-br-lg"}`
                          : `bg-white border border-gray-200 text-gray-800 shadow-sm ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-lg"} rounded-br-2xl ${isLastInGroup ? "rounded-bl-sm" : "rounded-bl-lg"}`
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>

                      {/* Hora + leído (solo último de cada grupo) */}
                      {isLastInGroup && (
                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                          <span className="text-[10px] text-gray-400">{formatTime(m.created_at)}</span>
                          {mine && (
                            m.is_read
                              ? <CheckCheck size={12} className="text-primary-500" />
                              : <Check size={12} className="text-gray-300" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={send}
        className="bg-white border-t border-gray-100 px-3 py-3 pb-8 flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none text-gray-800 placeholder-gray-400 focus:bg-gray-50 transition-colors"
          placeholder="Escribí un mensaje..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { send(e); } }}
          maxLength={1000}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${
            text.trim()
              ? "bg-primary-600 text-white shadow-md shadow-primary-200 scale-100"
              : "bg-gray-200 text-gray-400"
          }`}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  );
}
