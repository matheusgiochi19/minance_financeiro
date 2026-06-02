import { getAuthenticatedUser } from "@/lib/auth";

type Categoria = {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
};

type Bolso = {
  id: string;
  nome: string;
  cor: string;
  saldo_inicial: number;
};

type Cartao = {
  id: string;
  nome: string;
  cor: string;
};

type Movimento = {
  id: string;
  tipo: "receita" | "despesa";
  status: "pendente" | "paga" | null;
  recurrence_group_id: string | null;
  descricao: string;
  valor: number;
  data: string;
  observacoes: string | null;
  categoria: { id: string; nome: string; cor: string } | null;
  bolso: { id: string; nome: string } | null;
  cartao: { id: string; nome: string } | null;
};

export async function getDashboardData() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      categorias: [] as Categoria[],
      bolsos: [] as Bolso[],
      cartoes: [] as Cartao[],
      movimentosRecentes: [] as Movimento[],
      resumo: {
        receitas: 0,
        despesas: 0,
        saldo: 0,
        totalLancamentos: 0,
      },
    };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString().slice(0, 10);

  const [
    { data: categorias },
    { data: bolsos },
    { data: cartoes },
    { data: receitasRecentes },
    { data: despesasRecentes },
    { data: receitasMes },
    { data: despesasMes },
  ] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, nome, tipo, cor")
      .eq("user_id", user.id)
      .order("nome", { ascending: true }),
    supabase
      .from("bolsos")
      .select("id, nome, cor, saldo_inicial")
      .eq("user_id", user.id)
      .order("nome", { ascending: true }),
    supabase
      .from("cartoes")
      .select("id, nome, cor")
      .eq("user_id", user.id)
      .eq("ativo", true)
      .order("nome", { ascending: true }),
    supabase
      .from("receitas")
      .select(
        "id, recurrence_group_id, descricao, valor, data_recebimento, observacoes, categorias(id, nome, cor), bolsos(id, nome)",
      )
      .eq("user_id", user.id)
      .order("data_recebimento", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("despesas")
      .select(
        "id, status, recurrence_group_id, descricao, valor, data_despesa, observacoes, categorias(id, nome, cor), bolsos(id, nome), cartoes(id, nome)",
      )
      .eq("user_id", user.id)
      .order("data_despesa", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("receitas")
      .select("id, valor")
      .eq("user_id", user.id)
      .gte("data_recebimento", monthStartIso),
    supabase
      .from("despesas")
      .select("id, valor")
      .eq("user_id", user.id)
      .gte("data_despesa", monthStartIso),
  ]);

  const totalReceitas = (receitasMes ?? []).reduce(
    (sum, item) => sum + Number(item.valor ?? 0),
    0,
  );
  const totalDespesas = (despesasMes ?? []).reduce(
    (sum, item) => sum + Number(item.valor ?? 0),
    0,
  );

  const movimentosRecentes: Movimento[] = [
    ...(receitasRecentes ?? []).map((item) => ({
      id: item.id,
      tipo: "receita" as const,
      status: null,
      recurrence_group_id: item.recurrence_group_id,
      descricao: item.descricao,
      valor: Number(item.valor ?? 0),
      data: item.data_recebimento,
      observacoes: item.observacoes,
      categoria: Array.isArray(item.categorias)
        ? item.categorias[0] ?? null
        : item.categorias ?? null,
      bolso: Array.isArray(item.bolsos) ? item.bolsos[0] ?? null : item.bolsos ?? null,
      cartao: null,
    })),
    ...(despesasRecentes ?? []).map((item) => ({
      id: item.id,
      tipo: "despesa" as const,
      status: item.status ?? "pendente",
      recurrence_group_id: item.recurrence_group_id,
      descricao: item.descricao,
      valor: Number(item.valor ?? 0),
      data: item.data_despesa,
      observacoes: item.observacoes,
      categoria: Array.isArray(item.categorias)
        ? item.categorias[0] ?? null
        : item.categorias ?? null,
      bolso: Array.isArray(item.bolsos) ? item.bolsos[0] ?? null : item.bolsos ?? null,
      cartao: Array.isArray(item.cartoes)
        ? item.cartoes[0] ?? null
        : item.cartoes ?? null,
    })),
  ]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 12);

  return {
    categorias: (categorias ?? []) as Categoria[],
    bolsos: (bolsos ?? []).map((bolso) => ({
      ...bolso,
      saldo_inicial: Number(bolso.saldo_inicial ?? 0),
    })) as Bolso[],
    cartoes: (cartoes ?? []) as Cartao[],
    movimentosRecentes,
    resumo: {
      receitas: totalReceitas,
      despesas: totalDespesas,
      saldo: totalReceitas - totalDespesas,
      totalLancamentos: (receitasMes?.length ?? 0) + (despesasMes?.length ?? 0),
    },
  };
}

export async function getDespesasData() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      categorias: [] as Categoria[],
      bolsos: [] as Bolso[],
      cartoes: [] as Cartao[],
      despesas: [] as Movimento[],
    };
  }

  const [{ data: categorias }, { data: bolsos }, { data: cartoes }, { data: despesas }] =
    await Promise.all([
      supabase
        .from("categorias")
        .select("id, nome, tipo, cor")
        .eq("user_id", user.id)
        .order("nome", { ascending: true }),
      supabase
        .from("bolsos")
        .select("id, nome, cor, saldo_inicial")
        .eq("user_id", user.id)
        .order("nome", { ascending: true }),
      supabase
        .from("cartoes")
        .select("id, nome, cor")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .order("nome", { ascending: true }),
      supabase
        .from("despesas")
        .select(
          "id, status, recurrence_group_id, descricao, valor, data_despesa, observacoes, categorias(id, nome, cor), bolsos(id, nome), cartoes(id, nome)",
        )
        .eq("user_id", user.id)
        .order("data_despesa", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  const despesasNormalizadas: Movimento[] = (despesas ?? []).map((item) => ({
    id: item.id,
    tipo: "despesa",
    status: item.status ?? "pendente",
    recurrence_group_id: item.recurrence_group_id,
    descricao: item.descricao,
    valor: Number(item.valor ?? 0),
    data: item.data_despesa,
    observacoes: item.observacoes,
    categoria: Array.isArray(item.categorias)
      ? item.categorias[0] ?? null
      : item.categorias ?? null,
    bolso: Array.isArray(item.bolsos) ? item.bolsos[0] ?? null : item.bolsos ?? null,
    cartao: Array.isArray(item.cartoes) ? item.cartoes[0] ?? null : item.cartoes ?? null,
  }));

  return {
    categorias: (categorias ?? []) as Categoria[],
    bolsos: (bolsos ?? []).map((bolso) => ({
      ...bolso,
      saldo_inicial: Number(bolso.saldo_inicial ?? 0),
    })) as Bolso[],
    cartoes: (cartoes ?? []) as Cartao[],
    despesas: despesasNormalizadas,
  };
}

