import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { calcularSaldoLedger } from "@/services/ledger.service";

export type PeriodoFinanceiro = {
  fim: string;
  inicio: string;
};

export function getPeriodoMes(mes?: string): PeriodoFinanceiro & { mes: string } {
  const now = new Date();
  const selected = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = selected.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return {
    fim: end.toISOString().slice(0, 10),
    inicio: start.toISOString().slice(0, 10),
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
  const { data } = await supabase.rpc("calcular_fatura_cartao", {
    p_fim: periodo.fim,
    p_inicio: periodo.inicio,
    p_user_id: userId
  });
  return Number(data || 0);
});

export const calcularSaldo = cache(async (userId: string, periodo: PeriodoFinanceiro & { mes?: string }) => {
  return calcularSaldoLedger(userId, periodo);
});
