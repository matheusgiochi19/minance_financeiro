"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withUiAlert } from "@/lib/ui-alert";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  if (!fullName) {
    redirect(withUiAlert("/app/perfil", "error", "Informe um nome valido."));
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.auth.updateUser({ data: { full_name: fullName } });
  await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
  revalidatePath("/app", "layout");
  revalidatePath("/app/perfil");
  redirect(withUiAlert("/app/perfil", "success", "Perfil atualizado com sucesso."));
}

export async function updateEmail(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) {
    redirect(withUiAlert("/app/perfil", "error", "Informe um e-mail valido."));
  }
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.auth.updateUser({ email });
  await supabase.from("profiles").update({ email }).eq("user_id", user.id);
  revalidatePath("/app", "layout");
  revalidatePath("/app/perfil");
  redirect(withUiAlert("/app/perfil", "success", "E-mail atualizado com sucesso."));
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 6) {
    redirect(withUiAlert("/app/perfil", "error", "A senha deve ter pelo menos 6 caracteres."));
  }
  const supabase = await createClient();
  await supabase.auth.updateUser({ password });
  revalidatePath("/app/perfil");
  redirect(withUiAlert("/app/perfil", "success", "Senha atualizada com sucesso."));
}

export async function updateProfileTheme(formData: FormData) {
  const theme = String(formData.get("theme_preference") || "light") === "dark" ? "dark" : "light";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("profiles").update({ theme_preference: theme }).or(`user_id.eq.${user.id},id.eq.${user.id}`);
  if (error) {
    redirect(withUiAlert("/app/perfil", "error", `Nao foi possivel salvar o tema: ${error.message}`));
  }

  const { data: savedProfile, error: readError } = await supabase
    .from("profiles")
    .select("theme_preference")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();
  if (readError || !savedProfile || savedProfile.theme_preference !== theme) {
    redirect(withUiAlert("/app/perfil", "error", "Tema nao foi persistido no perfil."));
  }

  revalidatePath("/app", "layout");
  revalidatePath("/app/perfil");
  redirect(withUiAlert("/app/perfil", "success", "Tema atualizado com sucesso."));
}
