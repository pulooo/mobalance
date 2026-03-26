import api from "./api";

export interface PeriodBalance {
  ano: number;
  mes?: number;
  semana?: number;
  data_inicio?: string;
  data_fim?: string;
  total_vendas: number;
  total_compras: number;
  lucro: number;
  margem: number;
  produto_mais_lucrativo: string | null;
}

export type MonthBalance = PeriodBalance;

export interface HistoricoResponse {
  periodos: PeriodBalance[];
}

export async function getBalance(params: {
  periodo: "mensal" | "semanal";
  mes?: number;
  ano?: number;
  semana?: number;
}): Promise<PeriodBalance> {
  const { data } = await api.get<PeriodBalance>("/balance", { params });
  return data;
}

export async function getHistorico(
  periodo: "mensal" | "semanal"
): Promise<HistoricoResponse> {
  const { data } = await api.get<HistoricoResponse>("/balance/historico", {
    params: { periodo },
  });
  return data;
}
