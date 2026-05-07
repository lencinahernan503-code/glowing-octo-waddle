"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/productos/ProductCard";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";

interface FilterTab {
  label: string;
  param: "category" | "gender";
  value: string;
}

const TABS: FilterTab[] = [
  { label: "Todos",      param: "category", value: "" },
  { label: "Mujer",      param: "gender",   value: "mujer" },
  { label: "Hombre",     param: "gender",   value: "hombre" },
  { label: "Remeras",    param: "category", value: "remeras" },
  { label: "Pantalones", param: "category", value: "pantalones" },
  { label: "Vestidos",   param: "category", value: "vestidos" },
  { label: "Camperas",   param: "category", value: "camperas" },
  { label: "Buzos",      param: "category", value: "buzos" },
  { label: "Calzado",    param: "category", value: "calzado" },
  { label: "Bijouterie", param: "category", value: "bijouterie" },
  { label: "Accesorios", param: "category", value: "accesorios" },
  { label: "Deportiva",  param: "category", value: "deportiva" },
];

const SORT_OPTIONS = [
  { value: "newest",     label: "Más nuevo" },
  { value: "price_asc",  label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "rating",     label: "Mejor valorado" },
];

function ExplorarContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState(
    TABS.find(t => t.value === searchParams.get("categoria")) || TABS[0]
  );
  const [sort, setSort] = useState("newest");
  const [showSort, setShowSort] = useState(false);
  const [condition, setCondition] = useState("");

  const fetchProducts = useCallback(async (
    search: string,
    tab: FilterTab,
    sortBy: string,
    cond: string,
  ) => {
    setLoading(true);
    const params: Record<string, string> = { sort: sortBy };
    if (search.trim()) params.search = search.trim();
    if (tab.value) params[tab.param] = tab.value;
    if (cond) params.condition = cond;
    try {
      const { data } = await api.get("/products", { params });
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(query, activeTab, sort, condition);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeTab, sort, condition, fetchProducts]);

  const clearSearch = () => setQuery("");

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || "Ordenar";

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-3 sticky top-0 z-40 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Explorar</h1>

        {/* Barra de búsqueda */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full bg-gray-100 rounded-2xl pl-10 pr-10 py-3 text-sm outline-none text-gray-800 placeholder-gray-400"
            placeholder="Buscar por nombre, marca..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {TABS.map((tab) => (
            <button key={tab.label}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab.label === tab.label
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3">
        {/* Filtros rápidos */}
        <div className="flex items-center gap-2 mb-3">
          {/* Condición */}
          <div className="flex gap-1.5 flex-1">
            {["", "nuevo", "usado"].map((c) => (
              <button key={c}
                onClick={() => setCondition(c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  condition === c
                    ? "border-primary-600 bg-primary-600 text-white"
                    : "border-gray-200 bg-white text-gray-600"
                }`}>
                {c === "" ? "Todos" : c === "nuevo" ? "Nuevo" : "Usado"}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-white text-gray-600">
              <SlidersHorizontal size={11} />
              {currentSortLabel}
              <ChevronDown size={11} className={`transition-transform ${showSort ? "rotate-180" : ""}`} />
            </button>
            {showSort && (
              <div className="absolute right-0 top-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-30 w-44">
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value}
                    onClick={() => { setSort(opt.value); setShowSort(false); }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      sort === opt.value
                        ? "bg-primary-50 text-primary-700 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-2 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-gray-700 font-bold">Sin resultados</p>
            {query ? (
              <p className="text-gray-400 text-sm mt-1">
                No encontramos nada para &quot;<span className="font-semibold">{query}</span>&quot;
              </p>
            ) : (
              <p className="text-gray-400 text-sm mt-1">Probá con otra categoría</p>
            )}
            {(query || activeTab.value || condition) && (
              <button
                onClick={() => { setQuery(""); setActiveTab(TABS[0]); setCondition(""); }}
                className="mt-4 text-primary-600 font-semibold text-sm underline">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3 font-medium">
              {products.length} {products.length === 1 ? "producto" : "productos"}
              {query && <span> para &quot;<span className="font-semibold text-gray-600">{query}</span>&quot;</span>}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>

      {/* Cerrar sort al clickar afuera */}
      {showSort && (
        <div className="fixed inset-0 z-20" onClick={() => setShowSort(false)} />
      )}
    </div>
  );
}

export default function ExplorarPage() {
  return (
    <Suspense>
      <ExplorarContent />
    </Suspense>
  );
}
