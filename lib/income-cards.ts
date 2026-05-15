import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";

export type Receita = {
  id: string;
  descricao: string;
  valor: number;
  categoria_id: string | null;
  bolso_id: string | null;
  user_id: string;
  data_competencia: string;
  created_at: string;
  updated_at: string;
  categorias: { nome: string } | null;
  bolsos: { nome: string } | null;
};

export type Cartao = {
  id: string;
  nome: string;
  limite: number | null;
  cor: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type CartaoDespesa = {
  id: string;
  cartao_id: string;
  descricao: string;
  valor: number;
  status: "p" | "pp" | "ab";
  categoria_id: string | null;
  user_id: string;
  data_competencia: string;
  created_at: string;
  updated_at: string;
  categorias: { nome: string } | null;
};

export const cardColors = ["#AD563E", "#293B50", "#3C5D12", "#FF7654", "#6E5BD8", "#4CA6A8"];
export const cardExpenseStatusLabels: Record<CartaoDespesa["status"], string> = {
  ab: "Aberto",
  p: "Parcial",
  pp: "Pago"
};

export function randomCardColor() {
  return cardColors[Math.floor(Math.random() * cardColors.length)];
}

export async function getUserReceita(id: string) {
  const { supabase, user } = await requireAuthenticatedUser();
  return supabase
    .from("receitas")
    .select("id,descricao,valor,categoria_id,bolso_id,user_id,data_competencia,created_at,updated_at,categorias(nome),bolsos(nome)")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle<Receita>();
}

export async function getUserCartao(id: string) {
  const { supabase, user } = await requireAuthenticatedUser();
  return supabase
    .from("cartoes")
    .select("id,nome,limite,cor,user_id,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle<Cartao>();
}

export async function getUserCartaoDespesa(cartaoId: string, despesaId: string) {
  const { supabase, user } = await requireAuthenticatedUser();
  return supabase
    .from("cartao_despesas")
    .select("id,cartao_id,descricao,valor,status,categoria_id,user_id,data_competencia,created_at,updated_at,categorias(nome)")
    .eq("id", despesaId)
    .eq("cartao_id", cartaoId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle<CartaoDespesa>();
}

export async function getCurrentInvoiceTotal(cartaoId: string) {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const { data } = await supabase
    .from("cartao_despesas")
    .select("valor,status")
    .eq("cartao_id", cartaoId)
    .is("deleted_at", null)
    .gte("data_competencia", start.slice(0, 10))
    .lt("data_competencia", end.slice(0, 10))
    .returns<Array<{ status: CartaoDespesa["status"]; valor: number }>>();

  return (data || []).reduce((total, item) => (item.status === "pp" ? total : total + Number(item.valor || 0)), 0);
}
