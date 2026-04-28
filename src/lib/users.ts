import type { SupabaseClient, User } from "@supabase/supabase-js";

export type UsuarioAplicacao = {
  id: string;
  email: string;
  nome_completo: string | null;
  senha_provisoria_ativa: boolean;
};

export async function getUsuarioAplicacao(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data } = await supabase
    .from("users")
    .select("id, email, nome_completo, senha_provisoria_ativa")
    .eq("id", userId)
    .single();

  return (data ?? null) as UsuarioAplicacao | null;
}

export async function getUsuarioAutenticadoComPerfil(
  supabase: SupabaseClient,
  user: User | null,
) {
  if (!user) {
    return null;
  }

  return getUsuarioAplicacao(supabase, user.id);
}
