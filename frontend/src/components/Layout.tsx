import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const navLinks = [
  { to: "/dashboard", label: "Início" },
  { to: "/produtos", label: "Produtos" },
  { to: "/gastos", label: "Gastos" },
  { to: "/balanco", label: "Balanço" },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-700 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight">
            mobalance
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className="hover:text-brand-100 transition-colors">
                {label}
              </Link>
            ))}
            {user?.is_admin && (
              <Link to="/admin" className="hover:text-brand-100 transition-colors">
                Admin
              </Link>
            )}
            <span className="text-brand-200 hidden sm:inline">{user?.nome}</span>
            <button
              onClick={handleLogout}
              className="bg-white text-brand-700 px-3 py-1 rounded text-xs font-semibold hover:bg-brand-50 transition-colors"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        mobalance © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
