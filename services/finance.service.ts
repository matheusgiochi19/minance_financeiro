import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { calcularSaldoLedger } from "@/services/ledger.service";

export type PeriodoFinanceiro = {
  fim: string;
  inicio: string;
};

export function formatDateYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPeriodoMes(mes?: string): PeriodoFinanceiro & { mes: string } {
  const now = new Date();
  const selected = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = selected.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return {
    fim: formatDateYmd(end),
    inicio: formatDateYmd(start),
    mes: selected
  };
}

export const calcularTotalReceitas = cache(async (userId: string, periodo: PeriodoFinanceiro) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("calcular_total_receitas", {
    p_fim: periodo.fim,
    p_inicio: periodo.inicio,
    p_user_id: userId
  });
  return Number(data || 0);
});

export const calcularTotalDespesas = cache(async (userId: string, periodo: PeriodoFinanceiro) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("calcular_total_despesas", {
    p_fim: periodo.fim,
    p_inicio: periodo.inicio,
    p_user_id: userId
  });
  return Number(data || 0);
});

export const calcularFaturaCartao = cache(async (userId: string, mes: string) => {
  const supabase = await createClient();
  const periodo = getPeriodoMes(mes);
  const { data } = await supabase
    .from("cartao_despesas")
    .select("valor")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("data_competencia", periodo.inicio)
    .lt("data_competencia", periodo.fim)
    .returns<Array<{ valor: number }>>();

  return (data || []).reduce((total, item) => total + Number(item.valor || 0), 0);
});

export const calcularSaldo = cache(async (userId: string, periodo: PeriodoFinanceiro & { mes?: string }) => {
  return calcularSaldoLedger(userId, periodo);
});
