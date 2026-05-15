"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setFlashMessage } from "@/lib/flash";
import { normalizeName, requireAuthenticatedUser } from "@/lib/user-data";
import { withTransactionRetry } from "@/services/transaction.service";

export async function createCategoria(formData: FormData) {
  const nome = normalizeName(formData);

  if (!nome) {
    await setFlashMessage("error", "Informe um nome valido para a categoria.");
    redirect("/app/categorias/nova");
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  const { data: existing } = await supabase
    .from("categorias")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .ilike("nome", nome)
    .maybeSingle<{ id: string }>();

  if (existing) {
    await setFlashMessage("error", `A categoria "${nome}" ja existe.`);
    redirect("/app/categorias");
  }

  const result = await withTransactionRetry(() => supabase.rpc("create_categoria", { p_nome: nome }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    redirect("/app/categorias/nova");
  }
  await setFlashMessage("success", "Categoria salva com sucesso.");
  revalidatePath("/app/categorias");
  redirect("/app/categorias");
}

export async function updateCategoria(formData: FormData) {
  const id = String(formData.get("id") || "");
  const nome = normalizeName(formData);

  if (!id || !nome) {
    await setFlashMessage("error", "Nao foi possivel salvar a categoria.");
    redirect(id ? `/app/categorias/${id}/editar` : "/app/categorias");
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("update_categoria", { p_id: id, p_nome: nome }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    redirect(`/app/categorias/${id}/editar`);
  }
  await setFlashMessage("success", "Categoria atualizada com sucesso.");
  revalidatePath("/app/categorias");
  redirect("/app/categorias");
}

export async function deleteCategoria(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("delete_categoria", { p_id: id }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    revalidatePath("/app/categorias");
    return;
  }
  await setFlashMessage("success", "Categoria excluida com sucesso.");
  revalidatePath("/app/categorias");
}
