"use client";
import { useState } from "react";

const CATEGORIES = ["remeras","pantalones","vestidos","camperas","calzado","accesorios","otros"];
const GENDERS = ["hombre","mujer","unisex","nino"];
const SIZES = ["XS","S","M","L","XL","XXL","34","36","38","40","42","44","46"];
const SORT_OPTIONS = [
  { value: "newest",    label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc",label: "Precio: mayor a menor" },
  { value: "rating",    label: "Mejor puntuación" },
];

interface Props {
  onFilter: (params: Record<string, string>) => void;
}

export default function ProductFilters({ onFilter }: Props) {
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("");
  const [gender, setGender]       = useState("");
  const [minPrice, setMinPrice]   = useState("");
  const [maxPrice, setMaxPrice]   = useState("");
  const [size, setSize]           = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort]           = useState("newest");

  const apply = () => {
    const params: Record<string, string> = { sort };
    if (search)    params.search    = search;
    if (category)  params.category  = category;
    if (gender)    params.gender    = gender;
    if (minPrice)  params.min_price = minPrice;
    if (maxPrice)  params.max_price = maxPrice;
    if (size)      params.size      = size;
    if (condition) params.condition = condition;
    onFilter(params);
  };

  const reset = () => {
    setSearch(""); setCategory(""); setGender("");
    setMinPrice(""); setMaxPrice(""); setSize("");
    setCondition(""); setSort("newest");
    onFilter({ sort: "newest" });
  };

  return (
    <div className="card p-4 space-y-5">
      <h3 className="font-semibold text-gray-700">Filtros</h3>

      {/* Buscar */}
      <input
        className="input text-sm"
        placeholder="Buscar por nombre o marca..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && apply()}
      />

      {/* Ordenar */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Ordenar por</p>
        <select className="input text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Categoría */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Categoría</p>
        {CATEGORIES.map((c) => (
          <label key={c} className="flex items-center gap-2 text-sm py-0.5 capitalize cursor-pointer">
            <input type="radio" name="cat" checked={category === c} onChange={() => setCategory(c)} />
            {c}
          </label>
        ))}
        {category && (
          <button onClick={() => setCategory("")} className="text-xs text-primary-600 mt-1">
            Limpiar
          </button>
        )}
      </div>

      {/* Género */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Género</p>
        {GENDERS.map((g) => (
          <label key={g} className="flex items-center gap-2 text-sm py-0.5 capitalize cursor-pointer">
            <input type="radio" name="gen" checked={gender === g} onChange={() => setGender(g)} />
            {g === "nino" ? "Niño" : g}
          </label>
        ))}
        {gender && (
          <button onClick={() => setGender("")} className="text-xs text-primary-600 mt-1">
            Limpiar
          </button>
        )}
      </div>

      {/* Talle */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Talle disponible</p>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(size === s ? "" : s)}
              className={`px-2 py-1 rounded text-xs border font-medium transition-colors ${
                size === s
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Condición */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Condición</p>
        <div className="flex gap-2">
          {["nuevo", "usado"].map((c) => (
            <button
              key={c}
              onClick={() => setCondition(condition === c ? "" : c)}
              className={`flex-1 py-1.5 rounded-lg border text-sm font-medium capitalize transition-colors ${
                condition === c
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Precio (ARS)</p>
        <div className="flex gap-2">
          <input className="input text-sm" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <input className="input text-sm" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button onClick={apply} className="btn-primary text-sm">Aplicar filtros</button>
        <button onClick={reset} className="btn-secondary text-sm">Limpiar todo</button>
      </div>
    </div>
  );
}
