import { useEffect, useState } from "react";
import { listSales, registerLote, SaleResponse } from "../services/sales";
import { listProducts, StoreProduct } from "../services/storeProducts";

function hoje(): string {
  return new Date().toISOString().split("T")[0];
}

export default function Vendas() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [qtds, setQtds] = useState<Record<number, string>>({});
  const [data, setData] = useState(hoje());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // histórico do mês atual
  const now = new Date();
  const [sales, setSales] = useState<SaleResponse[]>([]);

  async function load() {
    try {
      const [prods, hist] = await Promise.all([
        listProducts(),
        listSales(now.getMonth() + 1, now.getFullYear()),
      ]);
      setProducts(prods);
      setSales(hist);
      setQtds(Object.fromEntries(prods.map((p) => [p.id, ""])));
    } catch {
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const items = Object.entries(qtds)
      .filter(([, q]) => q !== "" && parseFloat(q) > 0)
      .map(([id, q]) => ({ store_product_id: parseInt(id), quantidade: parseFloat(q) }));

    if (items.length === 0) {
      setError("Preenche a quantidade de pelo menos um produto.");
      return;
    }

    setSaving(true);
    try {
      const novas = await registerLote({ data, items });
      setSales((prev) => [...novas, ...prev]);
      setQtds(Object.fromEntries(products.map((p) => [p.id, ""])));
      const total = novas.reduce((s, v) => s + Number(v.total), 0);
      setSuccess(`✓ ${novas.length} venda(s) registada(s) — total €${total.toFixed(2)}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Erro ao registar vendas.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">A carregar…</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Registar vendas</h2>
      <p className="text-gray-500 text-sm mb-6">
        Preenche as quantidades que vendeste e clica no botão.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-1">Ainda não tens produtos na loja.</p>
          <p className="text-sm">Vai a "Os meus produtos" para adicionar.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow mb-4 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 flex items-center gap-4 text-sm">
              <label className="font-medium text-gray-700">Data das vendas:</label>
              <input
                type="date"
                value={data}
                max={hoje()}
                onChange={(e) => setData(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <table className="w-full text-sm">
              <thead className="text-gray-500 uppercase text-xs border-t border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-right text-gray-500">Preço</th>
                  <th className="px-4 py-3 text-center w-36">Quantidade vendida</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const q = parseFloat(qtds[p.id] || "0") || 0;
                  return (
                    <tr key={p.id} className={q > 0 ? "bg-brand-50" : ""}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{p.nome}</p>
                        <p className="text-xs text-gray-400">{p.unidade}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        €{Number(p.preco_venda).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={qtds[p.id] ?? ""}
                          onChange={(e) =>
                            setQtds((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          placeholder="0"
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {q > 0 ? `€${(q * Number(p.preco_venda)).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold text-base transition-colors disabled:opacity-60"
          >
            {saving ? "A registar…" : "Registar vendas"}
          </button>
        </form>
      )}

      {/* Histórico do mês */}
      {sales.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Vendas deste mês
          </h3>
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-right">Qtd</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 text-gray-500">
                      {new Date(s.data + "T00:00:00").toLocaleDateString("pt-PT")}
                    </td>
                    <td className="px-4 py-2 text-gray-800">{s.nome_produto}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{s.quantidade}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-800">
                      €{Number(s.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
