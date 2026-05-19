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
  await supabase.from("profiles").update({ juros_atraso: juros >= 0 ? juros : 0, tema: theme, theme_preference: theme }).eq("user_id", user.id);
  revalidatePath("/app", "layout");
  revalidatePath("/app/configuracoes");
  redirect(withUiAlert("/app/configuracoes", "success", "Configuracoes salvas com sucesso."));
}
