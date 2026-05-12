import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PeriodoFinanceiro } from "@/services/finance.service";

export type LedgerTipo = "entrada" | "saida" | "transferencia" | "ajuste";

export const calcularSaldoLedger = cache(async (userId: string, periodo: PeriodoFinanceiro) => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("calcular_saldo_ledger", {
    p_fim: periodo.fim,
    p_inicio: periodo.inicio,
    p_user_id: userId
  });

  if (error) {
    throw new Error(error.message);
  }

  return Number(data || 0);
});

export const listarLedgerPeriodo = cache(async (userId: string, periodo: PeriodoFinanceiro) => {
  const supabase = await createClient();
  return supabase
    .from("financial_ledger")
    .select("id,tipo,entidade_origem,entidade_id,valor,data_competencia,created_at")
    .eq("user_id", userId)
    .gte("data_competencia", periodo.inicio)
    .lt("data_competencia", periodo.fim)
    .is("deleted_at", null)
    .order("data_competencia", { ascending: false });
});
