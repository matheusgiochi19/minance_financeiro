"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeText } from "@/lib/security";
import { withUiAlert } from "@/lib/ui-alert";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const fullName = sanitizeText(formData.get("full_name"));
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

export async function requestAccountDeletion(formData: FormData) {
  const confirmation = String(formData.get("confirmation") || "").trim().toUpperCase();
  if (confirmation !== "EXCLUIR") {
    redirect(withUiAlert("/app/perfil", "error", "Digite EXCLUIR para confirmar."));
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date().toISOString();
  await Promise.all([
    supabase.from("receitas").update({ deleted_at: now }).eq("user_id", user.id).is("deleted_at", null),
    supabase.from("despesas").update({ deleted_at: now }).eq("user_id", user.id).is("deleted_at", null),
    supabase.from("cartao_despesas").update({ deleted_at: now }).eq("user_id", user.id).is("deleted_at", null),
    supabase.from("cartoes").update({ deleted_at: now }).eq("user_id", user.id).is("deleted_at", null),
    supabase.from("categorias").update({ deleted_at: now }).eq("user_id", user.id).is("deleted_at", null),
    supabase.from("bolsos").update({ deleted_at: now }).eq("user_id", user.id).is("deleted_at", null),
    supabase.from("orcamentos").delete().eq("user_id", user.id),
    supabase.from("financial_ledger").delete().eq("user_id", user.id)
  ]);
  await supabase
    .from("profiles")
    .update({ account_deleted_at: now, ativo: false, email: `deleted-${user.id}@minance.local`, full_name: null })
    .or(`user_id.eq.${user.id},id.eq.${user.id}`);
  await supabase.auth.signOut();
  redirect(withUiAlert("/login", "success", "Solicitacao de exclusao concluida. Seus dados financeiros foram removidos."));
}
