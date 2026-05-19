"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withUiAlert } from "@/lib/ui-alert";

export async function updateConfiguracoes(formData: FormData) {
  const juros = Number(String(formData.get("juros_atraso") || "0").replace(",", "."));
  const theme = String(formData.get("theme_preference") || "light") === "dark" ? "dark" : "light";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("profiles")
    .update({ juros_atraso: juros >= 0 ? juros : 0, theme_preference: theme })
    .or(`user_id.eq.${user.id},id.eq.${user.id}`);
  if (error) {
    redirect(withUiAlert("/app/configuracoes", "error", `Nao foi possivel salvar as configuracoes: ${error.message}`));
  }

  const { data: savedProfile, error: readError } = await supabase
    .from("profiles")
    .select("theme_preference")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();
  if (readError || !savedProfile || savedProfile.theme_preference !== theme) {
    redirect(withUiAlert("/app/configuracoes", "error", "Tema nao foi persistido no perfil."));
  }

  revalidatePath("/app", "layout");
  revalidatePath("/app/configuracoes");
  redirect(withUiAlert("/app/configuracoes", "success", "Configuracoes salvas com sucesso."));
}
