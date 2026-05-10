"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto px-6">
      {/* Header */}
      <div className="pt-14 pb-8">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mb-8">
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div className="mb-2">
          <span className="text-3xl font-black text-primary-600">Feriant</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
        <p className="text-gray-400 mt-1">Bienvenido/a de vuelta</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
          <input
            className="input"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Contraseña</label>
          <div className="relative">
            <input
              className="input pr-12"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <div className="py-8 text-center">
        <p className="text-gray-500 text-sm">
          ¿No tenés cuenta?{" "}
          <Link href="/auth/register" className="text-primary-600 font-bold">
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
