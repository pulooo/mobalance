import api from "./api";

export interface Purchase {
  id: number;
  nome_produto: string | null;
  quantidade: number;
  preco_unitario: number;
  total: number;
  data: string;
  criado_em: string;
}

export interface PurchaseCreate {
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  data: string;
}

export interface PriceResult {
  supermercado: string;
  nome: string;
  preco: number;
  unidade: string;
  atualizado_em: string;
}

export async function listPurchases(mes?: number, ano?: number): Promise<Purchase[]> {
  const { data } = await api.get<Purchase[]>("/purchases", { params: { mes, ano } });
  return data;
}

export async function createPurchase(payload: PurchaseCreate): Promise<Purchase> {
  const { data } = await api.post<Purchase>("/purchases", payload);
  return data;
}

export async function deletePurchase(id: number): Promise<void> {
  await api.delete(`/purchases/${id}`);
}

export async function searchPrices(supermercado: string, q = ""): Promise<PriceResult[]> {
  const { data } = await api.get<PriceResult[]>("/prices/search", {
    params: { supermercado, q },
  });
  return data;
}
