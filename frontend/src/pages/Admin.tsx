import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";
import { AuthUser, useAuthStore } from "../store/authStore";

interface AdminUser extends AuthUser {
  criado_em: string;
}

export default function Admin() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  if (!currentUser?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  async function fetchUsers() {
    try {
      const { data } = await api.get<AdminUser[]>("/admin/users");
      setUsers(data);
    } catch {
      setError("Erro ao carregar utilizadores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function toggleAtivo(user: AdminUser) {
    setUpdating(user.id);
    try {
      const { data } = await api.patch<AdminUser>(`/admin/users/${user.id}`, {
        ativo: !user.ativo,
      });
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
    } catch {
      setError("Erro ao atualizar utilizador.");
    } finally {
      setUpdating(null);
    }
  }

  async function setExpiracao(user: AdminUser, date: string) {
    setUpdating(user.id);
    try {
      const { data } = await api.patch<AdminUser>(`/admin/users/${user.id}`, {
        data_expiracao: date || null,
      });
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
    } catch {
      setError("Erro ao atualizar expiração.");
    } finally {
      setUpdating(null);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`Eliminar permanentemente "${user.nome}"?`)) return;
    setUpdating(user.id);
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      setError("Erro ao eliminar utilizador.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Painel de Admin</h2>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">A carregar…</p>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nome / Email</th>
                <th className="px-4 py-3 text-left">Registado em</th>
                <th className="px-4 py-3 text-left">Expiração</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`${user.id === currentUser.id ? "bg-brand-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{user.nome}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                    {user.is_admin && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium">
                        admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.criado_em).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-4 py-3">
                    {user.id !== currentUser.id ? (
                      <input
                        type="date"
                        defaultValue={user.data_expiracao ?? ""}
                        onBlur={(e) => setExpiracao(user, e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.ativo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.id !== currentUser.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleAtivo(user)}
                          disabled={updating === user.id}
                          className={`text-xs px-3 py-1 rounded font-medium transition-colors disabled:opacity-50 ${
                            user.ativo
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {updating === user.id
                            ? "…"
                            : user.ativo
                            ? "Desativar"
                            : "Ativar"}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          disabled={updating === user.id}
                          className="text-xs px-3 py-1 rounded font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Tu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
