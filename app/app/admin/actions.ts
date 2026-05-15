"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setFlashMessage } from "@/lib/flash";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isMaster, type AppRole } from "@/lib/profiles";

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
  const { error } = await supabase.from("profiles").update({ role }).eq("user_id", userId);
  if (error) {
    await setFlashMessage("error", error.message);
    revalidatePath("/app/admin");
    return;
  }
  await setFlashMessage("success", "Perfil do usuario atualizado com sucesso.");
  revalidatePath("/app/admin");
}

export async function toggleUserActive(formData: FormData) {
  const { user } = await requireMaster();
  const userId = String(formData.get("user_id") || "");
  const ativo = String(formData.get("ativo") || "") === "true";

  if (!userId || userId === user.id) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ ativo }).eq("user_id", userId);
  if (error) {
    await setFlashMessage("error", error.message);
    revalidatePath("/app/admin");
    return;
  }
  await setFlashMessage("success", ativo ? "Usuario desbloqueado com sucesso." : "Usuario bloqueado com sucesso.");
  revalidatePath("/app/admin");
}

export async function deleteUser(formData: FormData) {
  const { user } = await requireMaster();
  const userId = String(formData.get("user_id") || "");

  if (!userId || userId === user.id) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_user", { target_user_id: userId });
  if (error) {
    await setFlashMessage("error", error.message);
    revalidatePath("/app/admin");
    return;
  }
  await setFlashMessage("success", "Usuario excluido com sucesso.");
  revalidatePath("/app/admin");
}
