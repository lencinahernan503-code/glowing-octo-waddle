"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Product } from "@/types";
import { Search, Eye, EyeOff, ExternalLink } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchProducts = (params?: Record<string, string>) => {
    setLoading(true);
    api.get("/admin/products", { params })
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (activeFilter !== "") params.is_active = activeFilter;
    fetchProducts(params);
  };

  const toggleActive = async (product: Product) => {
    setToggling(product.id);
    try {
      const { data } = await api.patch(`/admin/products/${product.id}/toggle-active`);
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, ...data } : p));
    } finally {
      setToggling(null);
    }
  };

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <p className="text-sm text-gray-500 mt-1">{products.length} productos cargados</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Buscar</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 text-sm"
              placeholder="Título del producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Estado</label>
          <select className="input text-sm" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Ocultos</option>
          </select>
        </div>
        <button onClick={handleSearch} className="btn-primary text-sm">Filtrar</button>
        <button onClick={() => { setSearch(""); setActiveFilter(""); fetchProducts(); }} className="btn-secondary text-sm">
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-center py-16 text-gray-400">No se encontraron productos</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-500">#</th>
                <th className="text-left p-4 font-medium text-gray-500">Producto</th>
                <th className="text-left p-4 font-medium text-gray-500">Categoría</th>
                <th className="text-left p-4 font-medium text-gray-500">Precio</th>
                <th className="text-left p-4 font-medium text-gray-500">Estado</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const mainImg = product.images.find((i) => i.is_main) || product.images[0];
                return (
                  <tr key={product.id} className={`border-b last:border-0 hover:bg-gray-50 ${!product.is_active ? "opacity-60" : ""}`}>
                    <td className="p-4 text-gray-400">{product.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {mainImg ? (
                            <img src={`${API}${mainImg.url}`} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">👗</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.title}</p>
                          {product.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 capitalize">{product.category} · {product.gender}</td>
                    <td className="p-4 font-semibold text-primary-600">${product.price.toLocaleString("es-AR")}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {product.is_active ? "Activo" : "Oculto"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/productos/${product.id}`} target="_blank" className="text-gray-400 hover:text-blue-500 transition-colors">
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          onClick={() => toggleActive(product)}
                          disabled={toggling === product.id}
                          title={product.is_active ? "Ocultar" : "Activar"}
                          className={`transition-colors ${product.is_active ? "text-gray-400 hover:text-red-500" : "text-gray-400 hover:text-green-500"}`}
                        >
                          {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
