import { CSSProperties, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getBalance, getHistorico, PeriodBalance } from "../services/balance";

const MESES_PT = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function fmt(v: number) {
  return `€${v.toFixed(2)}`;
}

function getISOWeekInfo(d: Date): { week: number; year: number } {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        (week1.getDay() + 6) % 7) /
        7
    );
  return { week, year: date.getFullYear() };
}

function getWeekDates(week: number, year: number): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Day);
  const start = new Date(week1Monday);
  start.setDate(week1Monday.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function formatWeekLabel(week: number, year: number): string {
  const { start, end } = getWeekDates(week, year);
  const meses = MESES_PT.slice(1);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} a ${end.getDate()} de ${meses[end.getMonth()]}`;
  }
  return `${start.getDate()} de ${meses[start.getMonth()]} a ${end.getDate()} de ${meses[end.getMonth()]}`;
}

function prevWeek(week: number, year: number): { week: number; year: number } {
  if (week === 1) {
    const prevYear = year - 1;
    return { week: getISOWeekInfo(new Date(prevYear, 11, 28)).week, year: prevYear };
  }
  return { week: week - 1, year };
}

function nextWeek(week: number, year: number): { week: number; year: number } {
  const lastWeek = getISOWeekInfo(new Date(year, 11, 28)).week;
  if (week >= lastWeek) return { week: 1, year: year + 1 };
  return { week: week + 1, year };
}

// ─── Tema dinâmico por resultado ─────────────────────────────────────────────
// Usa inline styles para backgrounds para garantir que Tailwind não purga
// as cores dinâmicas em produção.

type ResultStatus = "positive" | "negative" | "zero";

function getStatus(lucro: number): ResultStatus {
  if (lucro > 0) return "positive";
  if (lucro < 0) return "negative";
  return "zero";
}

const THEME = {
  positive: {
    // bg #166534 = green-900
    cardBg: { backgroundColor: "#166534" } as CSSProperties,
    lucroValueStyle: { color: "#ffffff" } as CSSProperties,
    lucroLabel: "Lucro 🟢",
    lucroLabelClass: "text-green-200 text-xs uppercase font-semibold mb-1",
    margemClass: "text-green-200",
    emoji: "🟢",
  },
  negative: {
    // bg #7f1d1d = red-900
    cardBg: { backgroundColor: "#7f1d1d" } as CSSProperties,
    // número do prejuízo em vermelho vivo #ef4444
    lucroValueStyle: { color: "#ef4444" } as CSSProperties,
    lucroLabel: "⚠ Prejuízo",
    lucroLabelClass: "text-red-300 text-xs uppercase font-semibold mb-1",
    margemClass: "text-red-300",
    emoji: "🔴",
  },
  zero: {
    // bg #92400e = amber-800
    cardBg: { backgroundColor: "#92400e" } as CSSProperties,
    lucroValueStyle: { color: "#ffffff" } as CSSProperties,
    lucroLabel: "⚠ Neutro",
    lucroLabelClass: "text-amber-200 text-xs uppercase font-semibold mb-1",
    margemClass: "text-amber-200",
    emoji: "⚠️",
  },
} as const;

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Balanco() {
  const now = new Date();
  const todayWeek = getISOWeekInfo(now);

  const [modo, setModo] = useState<"mensal" | "semanal">("mensal");
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [semana, setSemana] = useState(todayWeek.week);
  const [semanaAno, setSemanaAno] = useState(todayWeek.year);
  const [balance, setBalance] = useState<PeriodBalance | null>(null);
  const [historico, setHistorico] = useState<PeriodBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params =
        modo === "mensal"
          ? { periodo: modo, mes, ano }
          : { periodo: modo, semana, ano: semanaAno };
      const [bal, hist] = await Promise.all([
        getBalance(params),
        getHistorico(modo),
      ]);
      setBalance(bal);
      setHistorico(hist.periodos);
    } catch {
      setError("Erro ao carregar balanço.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [modo, mes, ano, semana, semanaAno]);

  const chartData = historico.map((b) => ({
    name: b.semana != null ? `S${b.semana}` : MESES_PT[b.mes!].slice(0, 3),
    Vendas: Number(b.total_vendas),
    Custo: Number(b.total_compras),
    Lucro: Number(b.lucro),
  }));

  const lucroNum = balance ? Number(balance.lucro) : 0;
  const status = getStatus(lucroNum);
  const theme = THEME[status];
  const periodoLabel =
    modo === "mensal"
      ? `${MESES_PT[mes]} de ${ano}`
      : `Semana de ${formatWeekLabel(semana, semanaAno)}`;
  const prefixo = modo === "mensal" ? "Este mês" : "Esta semana";
  const periodoTexto = modo === "mensal" ? "este mês" : "esta semana";

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Balanço</h2>

      {/* Toggle Mensal / Semanal */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {(["mensal", "semanal"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModo(m)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              modo === m
                ? "bg-white shadow text-brand-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m === "mensal" ? "Mensal" : "Semanal"}
          </button>
        ))}
      </div>

      {/* Seletor de período */}
      {modo === "mensal" ? (
        <div className="flex items-center gap-3 mb-6">
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {MESES_PT.slice(1).map((nome, i) => (
              <option key={i + 1} value={i + 1}>{nome}</option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[ano - 1, ano, ano + 1].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { const p = prevWeek(semana, semanaAno); setSemana(p.week); setSemanaAno(p.year); }}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-lg font-bold"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[220px] text-center">
            Semana de {formatWeekLabel(semana, semanaAno)}
          </span>
          <button
            onClick={() => { const n = nextWeek(semana, semanaAno); setSemana(n.week); setSemanaAno(n.year); }}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-lg font-bold"
          >
            ›
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">A calcular…</p>
      ) : balance && (
        <>
          {/* Card de resumo — fundo dinâmico via inline style */}
          <div
            className="rounded-2xl shadow p-6 mb-6"
            style={
              Number(balance.total_vendas) === 0 && Number(balance.total_compras) === 0
                ? {}
                : theme.cardBg
            }
          >
            {Number(balance.total_vendas) === 0 && Number(balance.total_compras) === 0 ? (
              <p className="text-gray-500 text-lg">
                Ainda não há dados registados em <strong>{periodoLabel}</strong>.
              </p>
            ) : (
              <>
                <p className="text-white text-lg leading-relaxed mb-4">
                  {prefixo} vendeste{" "}
                  <span className="font-bold text-xl" style={{ color: "#86efac" }}>
                    {fmt(Number(balance.total_vendas))}
                  </span>
                  {Number(balance.total_compras) > 0 && (
                    <> e gastaste{" "}
                      <span className="text-red-300 font-bold text-xl">
                        {fmt(Number(balance.total_compras))}
                      </span>
                    </>
                  )}
                  {". "}
                  {status === "positive" && (
                    <>
                      O teu <strong>lucro</strong> foi de{" "}
                      <span className="font-bold text-xl" style={theme.lucroValueStyle}>
                        {fmt(lucroNum)}
                      </span>
                      {" "}(margem de <strong>{Number(balance.margem).toFixed(1)}%</strong>){" "}
                      {theme.emoji}
                    </>
                  )}
                  {status === "negative" && (
                    <>
                      Tiveste um <strong>prejuízo</strong> de{" "}
                      <span className="font-bold text-2xl" style={theme.lucroValueStyle}>
                        {fmt(Math.abs(lucroNum))}
                      </span>
                      {" "}{theme.emoji} — os gastos superaram as vendas
                    </>
                  )}
                  {status === "zero" && (
                    <>Não tiveste lucro nem prejuízo {periodoTexto} {theme.emoji}</>
                  )}
                </p>
                {balance.produto_mais_lucrativo && Number(balance.total_vendas) > 0 && (
                  <p className="text-white/70 text-sm">
                    Produto com mais receita:{" "}
                    <strong className="text-white">{balance.produto_mais_lucrativo}</strong>.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow p-4 text-center">
              <p className="text-xs text-gray-400 uppercase mb-1">Receita</p>
              <p className="text-2xl font-bold text-green-700">{fmt(Number(balance.total_vendas))}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-4 text-center">
              <p className="text-xs text-gray-400 uppercase mb-1">Gastos</p>
              <p className="text-2xl font-bold text-red-600">{fmt(Number(balance.total_compras))}</p>
            </div>
            {/* Card Lucro/Prejuízo — fundo dinâmico via inline style */}
            <div className="rounded-2xl shadow p-4 text-center" style={theme.cardBg}>
              <p className={theme.lucroLabelClass}>{theme.lucroLabel}</p>
              <p className="text-2xl font-bold" style={theme.lucroValueStyle}>
                {status === "negative" ? `-${fmt(Math.abs(lucroNum))}` : fmt(lucroNum)}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow p-4 text-center">
              <p className="text-xs text-gray-400 uppercase mb-1">Margem</p>
              <p className={`text-2xl font-bold ${
                status === "negative" ? "text-red-700" :
                status === "zero" ? "text-amber-700" : "text-gray-700"
              }`}>
                {Number(balance.margem).toFixed(1)}%
              </p>
            </div>
          </div>
        </>
      )}

      {/* Gráfico histórico */}
      {historico.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-4">
            {modo === "mensal" ? "Últimos 3 meses" : "Últimas 4 semanas"}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
              <Tooltip
                formatter={(value: number) => [`€${value.toFixed(2)}`]}
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
              />
              <Bar dataKey="Vendas" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Custo" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lucro" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.Lucro > 0 ? "#16a34a" : entry.Lucro < 0 ? "#ef4444" : "#f59e0b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Receita</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Custo</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-brand-700 inline-block" /> Lucro</span>
          </div>
        </div>
      )}
    </div>
  );
}
