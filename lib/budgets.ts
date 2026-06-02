import { requireAuthenticatedUser } from "@/lib/user-data";

export type Orcamento = {
  id: string;
  categoria_id: string;
  percentual_renda: number;
  valor_limite: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  categorias: { nome: string } | null;
};

export async function getUserOrcamento(id: string) {
  const { supabase, user } = await requireAuthenticatedUser();
  return supabase
    .from("orcamentos")
    .select("id,categoria_id,percentual_renda,valor_limite,user_id,created_at,updated_at,categorias(nome)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<Orcamento>();
}
