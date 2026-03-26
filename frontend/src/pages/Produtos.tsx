import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SaleAnaliseItem, getSalesAnalise, registerLote } from "../services/sales";
import {
  StoreProduct,
  StoreProductCreate,
  createProduct,
  deactivateProduct,
  listProducts,
  updateProduct,
  uploadFoto,
} from "../services/storeProducts";

const UNIDADES = ["un", "kg", "L", "cx", "pç", "m"];

const emptyForm: StoreProductCreate = { nome: "", preco_venda: 0, unidade: "un" };

function hoje(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Secção: lista + gestão de produtos ──────────────────────────────────────

function GestaoSection({
  products,
  onProductsChange,
}: {
  products: StoreProduct[];
  onProductsChange: (products: StoreProduct[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StoreProduct | null>(null);
  const [form, setForm] = useState<StoreProductCreate>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFotoFile(null);
    setFotoPreview(null);
    setShowForm(true);
    setError(null);
  }

  function openEdit(p: StoreProduct) {
    setEditing(p);
    setForm({ nome: p.nome, preco_venda: p.preco_venda, unidade: p.unidade });
    setFotoFile(null);
    setFotoPreview(p.foto_url);
    setShowForm(true);
    setError(null);
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let saved: StoreProduct;
      if (editing) {
        saved = await updateProduct(editing.id, form);
      } else {
        saved = await createProduct(form);
      }
      if (fotoFile) {
        saved = await uploadFoto(saved.id, fotoFile);
      }
      onProductsChange(
        editing
          ? products.map((p) => (p.id === saved.id ? saved : p))
          : [...products, saved]
      );
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Erro ao guardar produto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(p: StoreProduct) {
    if (!confirm(`Remover "${p.nome}"?`)) return;
    try {
      await deactivateProduct(p.id);
      onProductsChange(products.filter((x) => x.id !== p.id));
    } catch {
      setError("Erro ao remover produto.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Os meus produtos</h2>
        <button
          onClick={openCreate}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + Adicionar produto
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editing ? "Editar produto" : "Novo produto"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Foto */}
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-500 overflow-hidden bg-gray-50 flex-shrink-0"
                >
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-300">📷</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Foto do produto</p>
                  <p className="text-xs text-gray-400 mb-1">JPG, PNG ou WebP · máx. 5 MB</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    {fotoPreview ? "Alterar foto" : "Escolher foto"}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFotoChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do produto</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: Café expresso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço de venda (€)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.preco_venda || ""}
                  onChange={(e) => setForm({ ...form, preco_venda: parseFloat(e.target.value) })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                <select
                  value={form.unidade}
                  onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {saving ? "A guardar…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Ainda não tens produtos.</p>
          <p className="text-sm">Clica em "+ Adicionar produto" para começar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-right">Preço de venda</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.foto_url ? (
                        <img
                          src={p.foto_url}
                          alt={p.nome}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-300 text-lg">
                          📦
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{p.nome}</p>
                        <p className="text-xs text-gray-400">{p.unidade}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    €{Number(p.preco_venda).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeactivate(p)}
                        className="text-xs px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
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

// ─── Secção: Registar Vendas da Semana ───────────────────────────────────────

function VendasSection({ products }: { products: StoreProduct[] }) {
  const [qtds, setQtds] = useState<Record<number, string>>({});
  const [data, setData] = useState(hoje());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setQtds({});
      const total = novas.reduce((s, v) => s + Number(v.total), 0);
      setSuccess(`✓ ${novas.length} venda(s) guardada(s) — total €${total.toFixed(2)}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Erro ao registar vendas.");
    } finally {
      setSaving(false);
    }
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold text-gray-800 mb-1">Registar vendas da semana</h3>
      <p className="text-gray-500 text-sm mb-4">Preenche as quantidades vendidas e clica em Guardar.</p>

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

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow mb-4 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 flex items-center gap-4 text-sm border-b border-gray-100">
            <label className="font-medium text-gray-700">Data:</label>
            <input
              type="date"
              value={data}
              max={hoje()}
              onChange={(e) => setData(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <table className="w-full text-sm">
            <thead className="text-gray-500 uppercase text-xs border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-right">Preço</th>
                <th className="px-4 py-3 text-center w-36">Quantidade</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const q = parseFloat(qtds[p.id] || "0") || 0;
                return (
                  <tr key={p.id} className={q > 0 ? "bg-brand-50" : ""}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.foto_url ? (
                          <img src={p.foto_url} alt={p.nome} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">📦</div>
                        )}
                        <span className="font-medium text-gray-800">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">€{Number(p.preco_venda).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={qtds[p.id] ?? ""}
                        onChange={(e) => setQtds((prev) => ({ ...prev, [p.id]: e.target.value }))}
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
          {saving ? "A guardar…" : "Guardar vendas"}
        </button>
      </form>
    </div>
  );
}

// ─── Secção: Análise de Vendas ────────────────────────────────────────────────

function AnaliseSalesSection() {
  const [dados, setDados] = useState<SaleAnaliseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSalesAnalise()
      .then(setDados)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (dados.length === 0) return null;

  const chartData = dados.map((d) => ({
    nome: d.nome_produto,
    quantidade: Number(d.total_quantidade),
  }));

  const maxQty = chartData[0]?.quantidade ?? 0;
  const top = dados[0];
  const bottom = dados[dados.length - 1];

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold text-gray-800 mb-1">Análise de Vendas</h3>
      <p className="text-gray-500 text-sm mb-5">Quantidade total vendida por produto (todos os períodos).</p>

      <div className="bg-white rounded-2xl shadow p-6 mb-4">
        <ResponsiveContainer width="100%" height={Math.max(180, dados.length * 44)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
          >
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => String(v)} />
            <YAxis
              type="category"
              dataKey="nome"
              tick={{ fontSize: 12 }}
              width={130}
            />
            <Tooltip
              formatter={(value: number) => [`${value} un.`, "Quantidade"]}
              contentStyle={{ borderRadius: 8, fontSize: 13 }}
            />
            <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={entry.nome}
                  fill={entry.quantidade === maxQty ? "#15803d" : "#86efac"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Destaques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-green-600 font-semibold uppercase mb-0.5">Produto mais vendido</p>
            <p className="font-bold text-gray-800">{top.nome_produto}</p>
            <p className="text-sm text-gray-500">{Number(top.total_quantidade).toFixed(0)} unidades vendidas</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">📉</span>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Produto menos vendido</p>
            <p className="font-bold text-gray-800">{bottom.nome_produto}</p>
            <p className="text-sm text-gray-500">{Number(bottom.total_quantidade).toFixed(0)} unidades vendidas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Produtos() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">A carregar…</p>;

  return (
    <div>
      <GestaoSection products={products} onProductsChange={setProducts} />
      <VendasSection products={products} />
      <AnaliseSalesSection />
    </div>
  );
}
