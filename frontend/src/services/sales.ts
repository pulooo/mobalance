import api from "./api";

export interface SaleItem {
  store_product_id: number;
  quantidade: number;
}

export interface SaleLoteRequest {
  data: string; // "YYYY-MM-DD"
  items: SaleItem[];
}

export interface SaleResponse {
  id: number;
  store_product_id: number | null;
  nome_produto: string | null;
  quantidade: number;
  preco_unitario: number;
  total: number;
  data: string;
  periodo: string | null;
  criado_em: string;
}

export async function registerLote(payload: SaleLoteRequest): Promise<SaleResponse[]> {
  const { data } = await api.post<SaleResponse[]>("/sales/lote", payload);
  return data;
}

export async function listSales(mes: number, ano: number): Promise<SaleResponse[]> {
  const { data } = await api.get<SaleResponse[]>("/sales", { params: { mes, ano } });
  return data;
}

export interface SaleAnaliseItem {
  nome_produto: string;
  total_quantidade: number;
  total_receita: number;
}

export async function getSalesAnalise(): Promise<SaleAnaliseItem[]> {
  const { data } = await api.get<SaleAnaliseItem[]>("/sales/analise");
  return data;
}
