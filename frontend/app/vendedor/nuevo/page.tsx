"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Camera, Plus, X, Crown } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "remeras", label: "Remeras / Tops" },
  { value: "pantalones", label: "Pantalones / Jeans" },
  { value: "vestidos", label: "Vestidos / Faldas" },
  { value: "camperas", label: "Camperas / Abrigos" },
  { value: "buzos", label: "Buzos / Hoodies" },
  { value: "calzado", label: "Zapatillas / Calzado" },
  { value: "accesorios", label: "Carteras / Bolsos" },
  { value: "bijouterie", label: "Bijouterie / Joyería" },
  { value: "deportiva", label: "Ropa deportiva" },
  { value: "interior", label: "Ropa interior" },
  { value: "otros", label: "Otros" },
];

const SIZES_ROPA = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZES_CALZADO = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const GENDERS = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "unisex", label: "Unisex" },
  { value: "nino", label: "Niño/a" },
];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "",
    gender: "unisex", brand: "", condition: "usado",
  });
  const [sizes, setSizes] = useState<{ size: string; stock: string }[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [hasSub, setHasSub] = useState<boolean | null>(null);

  useEffect(() => {
    api.get("/subscriptions/my-subscription")
      .then(({ data }) => setHasSub(data.active))
      .catch(() => setHasSub(false));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const isCalzado = form.category === "calzado";
  const isAccesorio = ["accesorios", "bijouterie"].includes(form.category);
  const quickSizes = isCalzado ? SIZES_CALZADO : SIZES_ROPA;

  const toggleQuickSize = (s: string) => {
    setSizes((prev) =>
      prev.find((x) => x.size === s)
        ? prev.filter((x) => x.size !== s)
        : [...prev, { size: s, stock: "1" }]
    );
  };

  const addCustomSize = () => {
    if (!customSize.trim()) return;
    if (!sizes.find((x) => x.size === customSize)) {
      setSizes((prev) => [...prev, { size: customSize, stock: "1" }]);
    }
    setCustomSize("");
  };

  const removeSize = (s: string) => setSizes((prev) => prev.filter((x) => x.size !== s));
  const updateStock = (s: string, stock: string) =>
    setSizes((prev) => prev.map((x) => x.size === s ? { ...x, stock } : x));

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 8);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { setError("Seleccioná una categoría"); return; }
    if (sizes.length === 0 && !isAccesorio) { setError("Agregá al menos un talle"); return; }
    setLoading(true);
    setError("");
    try {
      const finalSizes = isAccesorio && sizes.length === 0
        ? [{ size: "Única", stock: 1 }]
        : sizes.map((s) => ({ size: s.size, stock: parseInt(s.stock) || 1 }));

      const { data: product } = await api.post("/products", {
        ...form,
        price: parseFloat(form.price),
        sizes: finalSizes,
      });

      if (images.length > 0) {
        const fd = new FormData();
        images.forEach((img) => fd.append("files", img));
        await api.post(`/products/${product.id}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      router.push("/vendedor");
    } catch (err: any) {
      if (err.response?.status === 402) {
        router.push("/suscripcion");
        return;
      }
      setError(err.response?.data?.detail || "Error al publicar");
    } finally {
      setLoading(false);
    }
  };

  if (hasSub === null) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  if (!hasSub) return (
    <div className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center px-6 pb-24">
      <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6">
        <Crown size={48} className="text-primary-600" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Suscripción requerida</h2>
      <p className="text-gray-400 text-center mb-8 text-sm">
        Para publicar productos necesitás el Plan Vendedor por $5.000/mes.
      </p>
      <Link href="/suscripcion"
        className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl text-sm text-center block mb-3">
        Ver planes y suscribirme
      </Link>
      <button onClick={() => router.back()} className="text-gray-400 text-sm font-medium">
        Volver
      </button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Publicar producto</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">

        {/* Fotos */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">Fotos <span className="text-gray-400 font-normal">(máx. 8)</span></p>
          <div className="flex gap-2 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                <img src={src} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5">
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {previews.length < 8 && (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                <Camera size={20} className="text-primary-600 mb-1" />
                <span className="text-xs text-gray-400">Agregar</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />
              </label>
            )}
          </div>
        </div>

        {/* Título */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">Título del producto *</label>
            <input className="input" placeholder="Ej: Zapatillas Nike Air Max blancas" value={form.title}
              onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">Descripción</label>
            <textarea className="input h-24 resize-none" placeholder="Contá más sobre el producto: estado, medidas, detalles..."
              value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">Marca (opcional)</label>
            <input className="input" placeholder="Ej: Nike, Adidas, Zara..." value={form.brand}
              onChange={(e) => set("brand", e.target.value)} />
          </div>
        </div>

        {/* Categoría */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-sm font-bold text-gray-700 mb-2 block">Categoría *</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.value} type="button" onClick={() => set("category", c.value)}
                className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                  form.category === c.value
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-gray-100 text-gray-600 bg-gray-50"
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Género + Condición */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Género</label>
            <div className="flex gap-2 flex-wrap">
              {GENDERS.map((g) => (
                <button key={g.value} type="button" onClick={() => set("gender", g.value)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.gender === g.value
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-gray-200 text-gray-600"
                  }`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Estado</label>
            <div className="flex gap-2">
              {[
                { v: "nuevo", l: "✨ Nuevo" },
                { v: "como nuevo", l: "👍 Como nuevo" },
                { v: "usado", l: "♻️ Usado" },
              ].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => set("condition", v)}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.condition === v
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-600"
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Talles */}
        {!isAccesorio && (
          <div className="bg-white rounded-2xl p-4">
            <label className="text-sm font-bold text-gray-700 mb-2 block">Talles disponibles *</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {quickSizes.map((s) => {
                const selected = !!sizes.find((x) => x.size === s);
                return (
                  <button key={s} type="button" onClick={() => toggleQuickSize(s)}
                    className={`w-12 h-10 rounded-xl border-2 text-sm font-bold transition-all ${
                      selected
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-gray-200 text-gray-600"
                    }`}>
                    {s}
                  </button>
                );
              })}
            </div>
            {/* Stock por talle */}
            {sizes.length > 0 && (
              <div className="space-y-2 mb-3">
                {sizes.map((s) => (
                  <div key={s.size} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-sm font-bold text-gray-700 w-12">{s.size}</span>
                    <input type="number" min="1" value={s.stock}
                      onChange={(e) => updateStock(s.size, e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none"
                      placeholder="Stock" />
                    <span className="text-xs text-gray-400">unid.</span>
                    <button type="button" onClick={() => removeSize(s.size)} className="text-gray-300 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Talle personalizado */}
            <div className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="Talle personalizado (ej: 44, 3XL)"
                value={customSize} onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())} />
              <button type="button" onClick={addCustomSize}
                className="bg-primary-600 text-white px-3 rounded-xl text-sm font-bold">
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Precio */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-sm font-bold text-gray-700 mb-1.5 block">Precio *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input className="input pl-8 text-lg font-bold" type="number" min="0" step="1"
              placeholder="0" value={form.price} onChange={(e) => set("price", e.target.value)} required />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Precio en pesos argentinos</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Publicando..." : "Publicar producto"}
        </button>
      </form>
    </div>
  );
}
