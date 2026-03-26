import { useEffect, useState } from "react";
import {
  Purchase,
  PurchaseCreate,
  PriceResult,
  createPurchase,
  deletePurchase,
  listPurchases,
  searchPrices,
} from "../services/purchases";

const SUPERMERCADOS = [
  { value: "continente", label: "Continente" },
  { value: "pingo_doce", label: "Pingo Doce" },
  { value: "intermarche", label: "Intermarché" },
  { value: "lidl", label: "Lidl" },
  { value: "auchan", label: "Auchan" },
];

function hoje(): string {
  return new Date().toISOString().split("T")[0];
}

const emptyForm: PurchaseCreate = {
  nome_produto: "",
  quantidade: 0,
  preco_unitario: 0,
  data: hoje(),
};

// ─── Parte A: Registo manual ──────────────────────────────────────────────────

function RegistoSection({
  purchases,
  prefill,
  onPrefillConsumed,
  onAdd,
  onDelete,
}: {
  purchases: Purchase[];
  prefill: Partial<PurchaseCreate> | null;
  onPrefillConsumed: () => void;
  onAdd: (p: Purchase) => void;
  onDelete: (id: number) => void;
}) {
  const [form, setForm] = useState<PurchaseCreate>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quando chega um prefill (do botão "Adicionar às compras"), aplica-o ao form
  useEffect(() => {
    if (!prefill) return;
    setForm((prev) => ({ ...prev, ...prefill }));
    onPrefillConsumed();
    // foca o campo de quantidade
    document.getElementById("campo-quantidade")?.focus();
  }, [prefill]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const p = await createPurchase(form);
      onAdd(p);
      setForm({ ...emptyForm, data: form.data });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Erro ao guardar compra.");
    } finally {
      setSaving(false);
    }
  }

  const totalMes = purchases.reduce((s, p) => s + Number(p.total), 0);

  return (
    <div id="registo-section">
      <h3 className="text-xl font-bold text-gray-800 mb-1">O que comprei</h3>
      <p className="text-gray-500 text-sm mb-4">
        Regista o que compraste: produto, quantidade e preço que pagaste.
      </p>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow p-4 mb-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Produto</label>
          <input
            type="text"
            value={form.nome_produto}
            onChange={(e) => setForm({ ...form, nome_produto: e.target.value })}
            required
            placeholder="Ex: Arroz agulha 1kg"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Qtd</label>
          <input
            id="campo-quantidade"
            type="number"
            min="0.001"
            step="0.001"
            value={form.quantidade || ""}
            onChange={(e) => setForm({ ...form, quantidade: parseFloat(e.target.value) })}
            required
            placeholder="1"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Preço pago (€)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.preco_unitario || ""}
            onChange={(e) => setForm({ ...form, preco_unitario: parseFloat(e.target.value) })}
            required
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
          <input
            type="date"
            value={form.data}
            max={hoje()}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-600 hover:bg-brand-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? "…" : "+ Adicionar"}
        </button>
      </form>

      {purchases.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">
          Ainda não há compras registadas este mês.
        </p>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3 text-right">Preço unit.</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                    {new Date(p.data + "T00:00:00").toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-4 py-2 text-gray-800">{p.nome_produto}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{Number(p.quantidade)}</td>
                  <td className="px-4 py-2 text-right text-gray-600">€{Number(p.preco_unitario).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-800">
                    €{Number(p.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={async () => {
                        if (!confirm("Eliminar esta compra?")) return;
                        await deletePurchase(p.id);
                        onDelete(p.id);
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={4} className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                  Total do mês:
                </td>
                <td className="px-4 py-2 text-right font-bold text-red-600">
                  €{totalMes.toFixed(2)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Parte B: Pesquisa de preços ──────────────────────────────────────────────

function PesquisaSection({
  onAddToCompras,
}: {
  onAddToCompras: (item: PriceResult) => void;
}) {
  const [supermercado, setSupermercado] = useState("continente");
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState<PriceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<number | null>(null); // índice do item recém-adicionado

  // Carrega todos os produtos do supermercado seleccionado
  async function loadAll(sup: string) {
    setLoading(true);
    try {
      setAllResults(await searchPrices(sup));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(supermercado);
  }, [supermercado]);

  // Filtragem em tempo real no frontend
  const filtered = query.trim().length === 0
    ? allResults
    : allResults.filter((r) => r.nome.toLowerCase().includes(query.trim().toLowerCase()));

  function handleAdd(r: PriceResult, idx: number) {
    onAddToCompras(r);
    setAdded(idx);
    setTimeout(() => setAdded(null), 1500);
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-1">Pesquisar preços</h3>
      <p className="text-gray-500 text-sm mb-4">
        Consulta os preços actuais e clica em "Adicionar" para pré-preencher o registo.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={supermercado}
          onChange={(e) => { setSupermercado(e.target.value); setQuery(""); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {SUPERMERCADOS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar produtos… (arroz, leite, café…)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-6">A carregar preços…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">
          Nenhum produto encontrado{query ? ` para "${query}"` : ""}.
        </p>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-right">Preço</th>
                <th className="px-4 py-3 text-center text-xs font-normal normal-case text-gray-400">
                  Actualizado em
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${added === i ? "bg-green-50" : ""}`}>
                  <td className="px-4 py-3 text-gray-800">{r.nome}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    €{r.preco.toFixed(2)}
                    <span className="text-xs text-gray-400 font-normal ml-1">/{r.unidade}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">{r.atualizado_em}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleAdd(r, i)}
                      className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                        added === i
                          ? "bg-green-100 text-green-700"
                          : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                      }`}
                    >
                      {added === i ? "✓ Adicionado" : "+ Adicionar"}
                    </button>
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

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Gastos() {
  const now = new Date();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  // Prefill para o formulário de registo, definido ao clicar em "Adicionar às compras"
  const [prefill, setPrefill] = useState<Partial<PurchaseCreate> | null>(null);

  useEffect(() => {
    listPurchases(now.getMonth() + 1, now.getFullYear())
      .then(setPurchases)
      .finally(() => setLoading(false));
  }, []);

  function handleAddToCompras(item: PriceResult) {
    // Pré-preenche o formulário com nome e preço do resultado
    setPrefill({ nome_produto: item.nome, preco_unitario: item.preco, quantidade: 1 });
    // Faz scroll até ao formulário de registo
    document.getElementById("registo-section")?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) return <p className="text-gray-500">A carregar…</p>;

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">Gastos e Compras</h2>

      <RegistoSection
        purchases={purchases}
        prefill={prefill}
        onPrefillConsumed={() => setPrefill(null)}
        onAdd={(p) => setPurchases((prev) => [p, ...prev])}
        onDelete={(id) => setPurchases((prev) => prev.filter((p) => p.id !== id))}
      />

      <hr className="border-gray-200" />

      <PesquisaSection onAddToCompras={handleAddToCompras} />
    </div>
  );
}
