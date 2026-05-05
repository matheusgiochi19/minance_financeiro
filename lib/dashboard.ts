import { formatCurrency, type ExpenseStatus } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";

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
      end: endDate.toISOString(),
      label: monthLabel(startDate),
      start: startDate.toISOString()
    };
  });
}

export async function getDashboardData() {
  const { user } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const months = getDashboardMonths();
  const current = months[1];

  const [receitas, despesas, faturas, categorias] = await Promise.all([
    supabase.from("receitas").select("valor,created_at").eq("user_id", user.id).gte("created_at", months[0].start).lt("created_at", months[5].end).returns<Array<{ created_at: string; valor: number }>>(),
    supabase.from("despesas").select("valor,status,created_at,categorias(nome)").eq("user_id", user.id).gte("created_at", months[0].start).lt("created_at", months[5].end).returns<Array<{ categorias: { nome: string } | null; created_at: string; status: ExpenseStatus; valor: number }>>(),
    supabase.from("cartao_despesas").select("valor,created_at").eq("user_id", user.id).gte("created_at", months[0].start).lt("created_at", months[5].end).returns<Array<{ created_at: string; valor: number }>>(),
    supabase.from("despesas").select("valor,categorias(nome)").eq("user_id", user.id).gte("created_at", current.start).lt("created_at", current.end).returns<Array<{ categorias: { nome: string } | null; valor: number }>>()
  ]);

  const sumByMonth = (items: Array<{ created_at: string; valor: number }> | null | undefined) =>
    months.map((month) =>
      (items || [])
        .filter((item) => item.created_at >= month.start && item.created_at < month.end)
        .reduce((total, item) => total + Number(item.valor || 0), 0)
    );

  const receitasMes = sumByMonth(receitas.data);
  const despesasMes = sumByMonth(despesas.data);
  const faturasMes = sumByMonth(faturas.data);
  const currentIndex = 1;
  const categoryMap = new Map<string, number>();

  for (const item of categorias.data || []) {
    const name = item.categorias?.nome || "Sem categoria";
    categoryMap.set(name, (categoryMap.get(name) || 0) + Number(item.valor || 0));
  }

  return {
    cards: {
      despesas: despesasMes[currentIndex],
      faturas: faturasMes[currentIndex],
      receitas: receitasMes[currentIndex],
      saldo: receitasMes[currentIndex] - despesasMes[currentIndex] - faturasMes[currentIndex]
    },
    categories: Array.from(categoryMap, ([nome, valor]) => ({ nome, valor })),
    formatted: {
      despesas: formatCurrency(despesasMes[currentIndex]),
      faturas: formatCurrency(faturasMes[currentIndex]),
      receitas: formatCurrency(receitasMes[currentIndex]),
      saldo: formatCurrency(receitasMes[currentIndex] - despesasMes[currentIndex] - faturasMes[currentIndex])
    },
    months,
    series: {
      despesas: despesasMes,
      faturas: faturasMes,
      receitas: receitasMes
    }
  };
}
