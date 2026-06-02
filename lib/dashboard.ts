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

export type TrendItem = {
  anterior: number;
  atual: number;
  nome: string;
  variacao: number;
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
  const [currentYear, currentMonth] = current.mes.split("-").map(Number);
  const previousDate = new Date(currentYear, currentMonth - 2, 1);
  const previous = getPeriodoMes(`${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}`);

  const [receitas, despesas, faturas, categorias, categoriasAnterior] = await Promise.all([
    supabase.from("receitas").select("valor,data_competencia").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", months[0].start).lt("data_competencia", months[5].end).returns<Array<{ data_competencia: string; valor: number }>>(),
    supabase.from("despesas").select("valor,status,data_competencia,categorias(nome)").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", months[0].start).lt("data_competencia", months[5].end).returns<Array<{ categorias: { nome: string } | null; data_competencia: string; status: ExpenseStatus; valor: number }>>(),
    supabase.from("cartao_despesas").select("valor,data_competencia").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", months[0].start).lt("data_competencia", months[5].end).returns<Array<{ data_competencia: string; valor: number }>>(),
    supabase.from("despesas").select("valor,categorias(nome)").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", current.inicio).lt("data_competencia", current.fim).returns<Array<{ categorias: { nome: string } | null; valor: number }>>(),
    supabase.from("despesas").select("valor,categorias(nome)").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", previous.inicio).lt("data_competencia", previous.fim).returns<Array<{ categorias: { nome: string } | null; valor: number }>>()
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
  const previousCategoryMap = new Map<string, number>();

  for (const item of categorias.data || []) {
    const name = item.categorias?.nome || "Sem categoria";
    categoryMap.set(name, (categoryMap.get(name) || 0) + Number(item.valor || 0));
  }

  for (const item of categoriasAnterior.data || []) {
    const name = item.categorias?.nome || "Sem categoria";
    previousCategoryMap.set(name, (previousCategoryMap.get(name) || 0) + Number(item.valor || 0));
  }

  const categoryRows = Array.from(categoryMap, ([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  const dominantCategory = categoryRows[0]
    ? { ...categoryRows[0], percentual: despesasReal > 0 ? Math.round((categoryRows[0].valor / despesasReal) * 100) : 0 }
    : null;
  const tendencias = Array.from(new Set([...categoryMap.keys(), ...previousCategoryMap.keys()]))
    .map((nome) => {
      const atual = categoryMap.get(nome) || 0;
      const anterior = previousCategoryMap.get(nome) || 0;
      return { anterior, atual, nome, variacao: atual - anterior };
    })
    .filter((item) => item.variacao !== 0)
    .sort((a, b) => Math.abs(b.variacao) - Math.abs(a.variacao))
    .slice(0, 5);
  const rendaComprometida = receitasReal > 0 ? Math.min(100, Math.round(((despesasReal + faturasReal) / receitasReal) * 100)) : 0;
  const gastoCartoes = receitasReal > 0 ? Math.min(100, Math.round((faturasReal / receitasReal) * 100)) : 0;
  const saldoAcumulado = receitasMes.reduce<Array<{ label: string; saldo: number }>>((acc, receita, index) => {
    const previousSaldo = acc[index - 1]?.saldo || 0;
    acc.push({ label: months[index].label, saldo: previousSaldo + receita - despesasMes[index] - faturasMes[index] });
    return acc;
  }, []);

  return {
    cards: {
      despesas: despesasReal,
      faturas: faturasReal,
      receitas: receitasReal,
      saldo: saldoReal
    },
    categories: categoryRows,
    formatted: {
      despesas: formatCurrency(despesasReal),
      faturas: formatCurrency(faturasReal),
      receitas: formatCurrency(receitasReal),
      saldo: formatCurrency(saldoReal)
    },
    insights: {
      dominantCategory,
      health: {
        cartoes: gastoCartoes,
        comprometida: rendaComprometida,
        livre: Math.max(0, 100 - rendaComprometida)
      },
      projection: {
        proximos30: Math.max(0, despesasReal + faturasReal)
      },
      saldoAcumulado,
      tendencias
    },
    months,
    series: {
      despesas: despesasMes,
      faturas: faturasMes,
      receitas: receitasMes
    }
  };
}
