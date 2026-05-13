"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import GoogleButton from "@/components/ui/GoogleButton";

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", role: "buyer" as "buyer" | "seller", store_name: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto px-6">
      <div className="pt-14 pb-6">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mb-8">
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div className="mb-2">
          <span className="text-3xl font-black text-primary-600">Feriant</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
        <p className="text-gray-400 mt-1">Es gratis y solo lleva un minuto</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-4">
        {/* Tipo de cuenta */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Quiero...</p>
          <div className="grid grid-cols-2 gap-3">
            {(["buyer", "seller"] as const).map((r) => (
              <button key={r} type="button" onClick={() => set("role", r)}
                className={`py-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
                  form.role === r
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-gray-200 text-gray-500 bg-white"
                }`}>
                <div className="text-2xl mb-1">{r === "buyer" ? "🛍️" : "🏪"}</div>
                {r === "buyer" ? "Comprar" : "Vender"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nombre completo</label>
          <input className="input" placeholder="Tu nombre" value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)} required />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
          <input className="input" type="email" placeholder="tu@email.com" value={form.email}
            onChange={(e) => set("email", e.target.value)} required />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Contraseña</label>
          <div className="relative">
            <input className="input pr-12" type={showPass ? "text" : "password"}
              placeholder="Mínimo 6 caracteres" value={form.password}
              onChange={(e) => set("password", e.target.value)} required minLength={6} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {form.role === "seller" && (
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nombre de tu tienda</label>
            <input className="input" placeholder="Ej: Ropa de Martina" value={form.store_name}
              onChange={(e) => set("store_name", e.target.value)} required />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <GoogleButton label="Registrarse con Google" />
      </form>

      <div className="py-8 text-center">
        <p className="text-gray-500 text-sm">
          ¿Ya tenés cuenta?{" "}
          <Link href="/auth/login" className="text-primary-600 font-bold">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
