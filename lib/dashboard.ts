import { formatCurrency, type ExpenseStatus } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";
import { calcularFaturaCartao, calcularSaldo, calcularTotalDespesas, calcularTotalReceitas, getPeriodoMes } from "@/services/finance.service";

export type MonthPoint = {
  end: string;
  label: string;
  start: string;
};

export type CategorySlice = {
  nome: string;
  valor: number;
};

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date).replace(".", "");
}

export function getDashboardMonths(): MonthPoint[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const offset = index - 1;
    const startDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
    return {
      end: endDate.toISOString().slice(0, 10),
      label: monthLabel(startDate),
      start: startDate.toISOString().slice(0, 10)
    };
  });
}

export async function getDashboardData(mes?: string) {
  const { user } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const months = getDashboardMonths();
  const current = getPeriodoMes(mes);

  const [receitas, despesas, faturas, categorias] = await Promise.all([
    supabase.from("receitas").select("valor,data_competencia").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", months[0].start).lt("data_competencia", months[5].end).returns<Array<{ data_competencia: string; valor: number }>>(),
    supabase.from("despesas").select("valor,status,data_competencia,categorias(nome)").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", months[0].start).lt("data_competencia", months[5].end).returns<Array<{ categorias: { nome: string } | null; data_competencia: string; status: ExpenseStatus; valor: number }>>(),
    supabase.from("cartao_despesas").select("valor,data_competencia").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", months[0].start).lt("data_competencia", months[5].end).returns<Array<{ data_competencia: string; valor: number }>>(),
    supabase.from("despesas").select("valor,categorias(nome)").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", current.inicio).lt("data_competencia", current.fim).returns<Array<{ categorias: { nome: string } | null; valor: number }>>()
  ]);

  const sumByMonth = (items: Array<{ data_competencia: string; valor: number }> | null | undefined) =>
    months.map((month) =>
      (items || [])
        .filter((item) => item.data_competencia >= month.start && item.data_competencia < month.end)
        .reduce((total, item) => total + Number(item.valor || 0), 0)
    );

  const receitasMes = sumByMonth(receitas.data);
  const despesasMes = sumByMonth(despesas.data);
  const faturasMes = sumByMonth(faturas.data);
  const [saldoReal, receitasReal, despesasReal, faturasReal] = await Promise.all([
    calcularSaldo(user.id, current),
    calcularTotalReceitas(user.id, current),
    calcularTotalDespesas(user.id, current),
    calcularFaturaCartao(user.id, current.mes)
  ]);
  const categoryMap = new Map<string, number>();

  for (const item of categorias.data || []) {
    const name = item.categorias?.nome || "Sem categoria";
    categoryMap.set(name, (categoryMap.get(name) || 0) + Number(item.valor || 0));
  }

  return {
    cards: {
      despesas: despesasReal,
      faturas: faturasReal,
      receitas: receitasReal,
      saldo: saldoReal
    },
    categories: Array.from(categoryMap, ([nome, valor]) => ({ nome, valor })),
    formatted: {
      despesas: formatCurrency(despesasReal),
      faturas: formatCurrency(faturasReal),
      receitas: formatCurrency(receitasReal),
      saldo: formatCurrency(saldoReal)
    },
    months,
    series: {
      despesas: despesasMes,
      faturas: faturasMes,
      receitas: receitasMes
    }
  };
}
