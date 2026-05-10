"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { ArrowLeft, Camera, X, Save } from "lucide-react";

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
];
const SIZES_ROPA = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZES_CALZADO = ["35","36","37","38","39","40","41","42","43","44","45"];
const GENDERS = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "unisex", label: "Unisex" },
  { value: "nino", label: "Niño/a" },
];
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: number; url: string }[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "",
    gender: "unisex", brand: "", condition: "usado",
  });
  const [sizes, setSizes] = useState<{ size: string; stock: string }[]>([]);
  const [customSize, setCustomSize] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then(({ data }) => {
      setForm({
        title: data.title,
        description: data.description || "",
        price: String(data.price),
        category: data.category,
        gender: data.gender,
        brand: data.brand || "",
        condition: data.condition,
      });
      setSizes(data.sizes.map((s: any) => ({ size: s.size, stock: String(s.stock) })));
      setExistingImages(data.images || []);
    }).finally(() => setFetching(false));
  }, [id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isCalzado = form.category === "calzado";
  const isAccesorio = ["accesorios", "bijouterie"].includes(form.category);
  const quickSizes = isCalzado ? SIZES_CALZADO : SIZES_ROPA;

  const toggleSize = (s: string) =>
    setSizes(prev => prev.find(x => x.size === s) ? prev.filter(x => x.size !== s) : [...prev, { size: s, stock: "1" }]);

  const addCustomSize = () => {
    if (!customSize.trim() || sizes.find(x => x.size === customSize)) return;
    setSizes(prev => [...prev, { size: customSize, stock: "1" }]);
    setCustomSize("");
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 8 - existingImages.length);
    setNewImages(files);
    setNewPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { setError("Seleccioná una categoría"); return; }
    setLoading(true);
    setError("");
    try {
      await api.patch(`/products/${id}`, {
        ...form,
        price: parseFloat(form.price),
      });
      if (newImages.length > 0) {
        const fd = new FormData();
        newImages.forEach(img => fd.append("files", img));
        await api.post(`/products/${id}/images`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setSuccess(true);
      setTimeout(() => router.push("/vendedor"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">✓</div>
      <p className="text-xl font-bold text-gray-900">Producto actualizado</p>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen pb-24">
      <div className="sticky top-0 bg-white px-4 pt-14 pb-4 z-40 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Editar producto</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-6 space-y-6">
        {/* Imágenes existentes */}
        {existingImages.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Fotos actuales</p>
            <div className="flex gap-2 flex-wrap">
              {existingImages.map(img => (
                <div key={img.id} className="w-20 h-20 rounded-xl overflow-hidden relative bg-gray-100">
                  <Image src={`${API}${img.url}`} alt="foto" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agregar fotos nuevas */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Agregar fotos nuevas</p>
          <div className="flex gap-2 flex-wrap">
            {newPreviews.map((src, i) => (
              <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative bg-gray-100">
                <Image src={src} alt="" fill className="object-cover" />
                <button type="button" onClick={() => { setNewImages(p => p.filter((_, j) => j !== i)); setNewPreviews(p => p.filter((_, j) => j !== i)); }}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"><X size={12} className="text-white" /></button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
              <Camera size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Agregar</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="label">Título *</label>
          <input className="input" value={form.title} onChange={e => set("title", e.target.value)} required />
        </div>

        {/* Precio */}
        <div>
          <label className="label">Precio (ARS) *</label>
          <input className="input" type="number" min="0" value={form.price} onChange={e => set("price", e.target.value)} required />
        </div>

        {/* Categoría */}
        <div>
          <label className="label">Categoría *</label>
          <select className="input" value={form.category} onChange={e => set("category", e.target.value)} required>
            <option value="">Seleccioná...</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Género */}
        <div>
          <label className="label">Género</label>
          <div className="flex gap-2 flex-wrap">
            {GENDERS.map(g => (
              <button key={g.value} type="button" onClick={() => set("gender", g.value)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold border-2 transition-all ${form.gender === g.value ? "border-primary-600 bg-primary-600 text-white" : "border-gray-200 text-gray-700"}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Condición */}
        <div>
          <label className="label">Condición</label>
          <div className="flex gap-2">
            {["nuevo", "usado"].map(c => (
              <button key={c} type="button" onClick={() => set("condition", c)}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 capitalize transition-all ${form.condition === c ? "border-primary-600 bg-primary-600 text-white" : "border-gray-200 text-gray-700"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Talles */}
        {!isAccesorio && (
          <div>
            <label className="label">Talles y stock</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {quickSizes.map(s => (
                <button key={s} type="button" onClick={() => toggleSize(s)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${sizes.find(x => x.size === s) ? "border-primary-600 bg-primary-600 text-white" : "border-gray-200 text-gray-700"}`}>
                  {s}
                </button>
              ))}
            </div>
            {sizes.length > 0 && (
              <div className="space-y-2">
                {sizes.map(s => (
                  <div key={s.size} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="font-semibold text-sm w-12">{s.size}</span>
                    <input type="number" min="1" value={s.stock} onChange={e => setSizes(prev => prev.map(x => x.size === s.size ? { ...x, stock: e.target.value } : x))}
                      className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                    <span className="text-xs text-gray-400">unidades</span>
                    <button type="button" onClick={() => setSizes(prev => prev.filter(x => x.size !== s.size))} className="ml-auto text-gray-400 hover:text-red-500"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <input className="input flex-1 text-sm" placeholder="Talle personalizado" value={customSize} onChange={e => setCustomSize(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomSize())} />
              <button type="button" onClick={addCustomSize} className="px-4 py-2 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700">+ Agregar</button>
            </div>
          </div>
        )}

        {/* Marca y descripción */}
        <div>
          <label className="label">Marca</label>
          <input className="input" placeholder="Ej: Zara, Nike..." value={form.brand} onChange={e => set("brand", e.target.value)} />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input resize-none" rows={3} value={form.description} onChange={e => set("description", e.target.value)} />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-60">
          <Save size={20} />
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
