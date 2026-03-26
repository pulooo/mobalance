import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBalance, MonthBalance } from "../services/balance";
import { useAuthStore } from "../store/authStore";

const MESES_PT = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const now = new Date();
  const [balance, setBalance] = useState<MonthBalance | null>(null);

  useEffect(() => {
    getBalance(now.getMonth() + 1, now.getFullYear())
      .then(setBalance)
      .catch(() => null);
  }, []);

  const cards = balance
    ? [
        { label: "Receita do mês", value: `€${Number(balance.total_vendas).toFixed(2)}`, color: "text-green-700" },
        { label: "Custo do mês", value: `€${Number(balance.total_compras).toFixed(2)}`, color: "text-red-600" },
        { label: "Lucro do mês", value: `€${Number(balance.lucro).toFixed(2)}`, color: Number(balance.lucro) >= 0 ? "text-brand-700" : "text-red-600" },
      ]
    : [
        { label: "Receita do mês", value: "—", color: "text-gray-400" },
        { label: "Custo do mês", value: "—", color: "text-gray-400" },
        { label: "Lucro do mês", value: "—", color: "text-gray-400" },
      ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-1">
        Olá, {user?.nome}!
      </h2>
      <p className="text-gray-500 mb-6">
        {MESES_PT[now.getMonth() + 1]} de {now.getFullYear()}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Atalhos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: "/produtos", emoji: "📦", title: "Os meus produtos", desc: "Gere os teus produtos e regista as vendas da semana" },
          { to: "/gastos", emoji: "🛒", title: "Gastos e Compras", desc: "Regista o que compraste e consulta preços" },
          { to: "/balanco", emoji: "📊", title: "Ver balanço", desc: "Quanto ganhaste este mês" },
        ].map(({ to, emoji, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow flex gap-4 items-start"
          >
            <span className="text-3xl">{emoji}</span>
            <div>
              <p className="font-semibold text-gray-800">{title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
