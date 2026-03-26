import api from "./api";

export interface StoreProduct {
  id: number;
  user_id: number;
  nome: string;
  preco_venda: number;
  unidade: string;
  foto_url: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface StoreProductCreate {
  nome: string;
  preco_venda: number;
  unidade: string;
}

export async function listProducts(includeInactive = false): Promise<StoreProduct[]> {
  const { data } = await api.get<StoreProduct[]>("/store-products", {
    params: { include_inactive: includeInactive },
  });
  return data;
}

export async function createProduct(payload: StoreProductCreate): Promise<StoreProduct> {
  const { data } = await api.post<StoreProduct>("/store-products", payload);
  return data;
}

export async function updateProduct(
  id: number,
  payload: Partial<StoreProductCreate & { ativo: boolean }>
): Promise<StoreProduct> {
  const { data } = await api.patch<StoreProduct>(`/store-products/${id}`, payload);
  return data;
}

export async function deactivateProduct(id: number): Promise<void> {
  await api.delete(`/store-products/${id}`);
}

export async function uploadFoto(id: number, file: File): Promise<StoreProduct> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<StoreProduct>(`/store-products/${id}/foto`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
