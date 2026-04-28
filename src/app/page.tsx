import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUsuarioAutenticadoComPerfil } from "@/lib/users";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const usuario = await getUsuarioAutenticadoComPerfil(supabase, session.user);
    redirect(usuario?.senha_provisoria_ativa ? "/primeiro-acesso" : "/dashboard");
  }

  redirect("/auth");
}
