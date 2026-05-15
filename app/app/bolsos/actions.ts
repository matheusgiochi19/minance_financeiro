"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setFlashMessage } from "@/lib/flash";
import { normalizeName, requireAuthenticatedUser } from "@/lib/user-data";
import { withTransactionRetry } from "@/services/transaction.service";

export async function createBolso(formData: FormData) {
  const nome = normalizeName(formData);

  if (!nome) {
    await setFlashMessage("error", "Informe um nome valido para o bolso.");
    redirect("/app/bolsos/novo");
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("create_bolso", { p_nome: nome }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    redirect("/app/bolsos/novo");
  }
  await setFlashMessage("success", "Bolso salvo com sucesso.");
  revalidatePath("/app/bolsos");
  redirect("/app/bolsos");
}

export async function updateBolso(formData: FormData) {
  const id = String(formData.get("id") || "");
  const nome = normalizeName(formData);

  if (!id || !nome) {
    await setFlashMessage("error", "Nao foi possivel salvar o bolso.");
    redirect(id ? `/app/bolsos/${id}/editar` : "/app/bolsos");
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("update_bolso", { p_id: id, p_nome: nome }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    redirect(`/app/bolsos/${id}/editar`);
  }
  await setFlashMessage("success", "Bolso atualizado com sucesso.");
  revalidatePath("/app/bolsos");
  redirect("/app/bolsos");
}

export async function deleteBolso(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("delete_bolso", { p_id: id }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    revalidatePath("/app/bolsos");
    return;
  }
  await setFlashMessage("success", "Bolso excluido com sucesso.");
  revalidatePath("/app/bolsos");
}
