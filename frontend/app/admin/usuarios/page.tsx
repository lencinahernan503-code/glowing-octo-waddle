"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { Search, UserCheck, UserX, ShieldCheck } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  buyer: "Comprador",
  seller: "Vendedor",
  admin: "Admin",
};

const ROLE_COLOR: Record<string, string> = {
  buyer: "bg-gray-100 text-gray-600",
  seller: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchUsers = (params?: Record<string, string>) => {
    setLoading(true);
    api.get("/admin/users", { params })
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    fetchUsers(params);
  };

  const toggleActive = async (user: User) => {
    setToggling(user.id);
    try {
      const { data } = await api.patch(`/admin/users/${user.id}/toggle-active`);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ...data } : u));
    } finally {
      setToggling(null);
    }
  };

  const promoteToAdmin = async (user: User) => {
    if (!confirm(`¿Promover a ${user.full_name} como administrador?`)) return;
    await api.patch(`/admin/users/${user.id}/role`, null, { params: { new_role: "admin" } });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: "admin" } : u));
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} usuarios cargados</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Buscar</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 text-sm"
              placeholder="Nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Rol</label>
          <select className="input text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="buyer">Comprador</option>
            <option value="seller">Vendedor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button onClick={handleSearch} className="btn-primary text-sm">Filtrar</button>
        <button onClick={() => { setSearch(""); setRoleFilter(""); fetchUsers(); }} className="btn-secondary text-sm">
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center py-16 text-gray-400">No se encontraron usuarios</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-500">#</th>
                <th className="text-left p-4 font-medium text-gray-500">Usuario</th>
                <th className="text-left p-4 font-medium text-gray-500">Rol</th>
                <th className="text-left p-4 font-medium text-gray-500">Registro</th>
                <th className="text-left p-4 font-medium text-gray-500">Estado</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={`border-b last:border-0 hover:bg-gray-50 ${!user.is_active ? "opacity-60" : ""}`}>
                  <td className="p-4 text-gray-400">{user.id}</td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {user.store_name && (
                      <p className="text-xs text-blue-500 mt-0.5">🏪 {user.store_name}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLOR[user.role]}`}>
                      {ROLE_LABEL[user.role]}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(user.created_at).toLocaleDateString("es-AR", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {user.is_active ? "Activo" : "Suspendido"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      {user.role !== "admin" && (
                        <button
                          onClick={() => promoteToAdmin(user)}
                          title="Promover a admin"
                          className="text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          <ShieldCheck size={17} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleActive(user)}
                        disabled={toggling === user.id}
                        title={user.is_active ? "Suspender" : "Activar"}
                        className={`transition-colors ${user.is_active ? "text-gray-400 hover:text-red-500" : "text-gray-400 hover:text-green-500"}`}
                      >
                        {user.is_active ? <UserX size={17} /> : <UserCheck size={17} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
