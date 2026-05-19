"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isMaster, type AppRole } from "@/lib/profiles";
import { withUiAlert } from "@/lib/ui-alert";

async function requireMaster() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!isMaster(profile)) {
    redirect("/app/dashboard");
  }

  return { user, profile };
}

export async function updateUserRole(formData: FormData) {
  await requireMaster();

  const userId = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "") as AppRole;

  if (!userId || !["user", "master"].includes(role)) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("user_id", userId);
  revalidatePath("/app/admin");
  redirect(withUiAlert("/app/admin", "success", "Perfil do usuario atualizado com sucesso."));
}

export async function toggleUserActive(formData: FormData) {
  const { user } = await requireMaster();
  const userId = String(formData.get("user_id") || "");
  const ativo = String(formData.get("ativo") || "") === "true";

  if (!userId || userId === user.id) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("profiles").update({ ativo }).eq("user_id", userId);
  revalidatePath("/app/admin");
  redirect(withUiAlert("/app/admin", "success", ativo ? "Usuario desbloqueado com sucesso." : "Usuario bloqueado com sucesso."));
}

export async function deleteUser(formData: FormData) {
  const { user } = await requireMaster();
  const userId = String(formData.get("user_id") || "");

  if (!userId || userId === user.id) {
    return;
  }

  const supabase = await createClient();
  await supabase.rpc("admin_delete_user", { target_user_id: userId });
  revalidatePath("/app/admin");
  redirect(withUiAlert("/app/admin", "success", "Usuario excluido com sucesso."));
}
