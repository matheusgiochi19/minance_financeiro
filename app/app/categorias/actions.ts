"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeName, requireAuthenticatedUser } from "@/lib/user-data";
import { withTransactionRetry } from "@/services/transaction.service";

export async function createCategoria(formData: FormData) {
  const nome = normalizeName(formData);

  if (!nome) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("create_categoria", { p_nome: nome }));
  revalidatePath("/app/categorias");
  redirect("/app/categorias");
}

export async function updateCategoria(formData: FormData) {
  const id = String(formData.get("id") || "");
  const nome = normalizeName(formData);

  if (!id || !nome) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("update_categoria", { p_id: id, p_nome: nome }));
  revalidatePath("/app/categorias");
  redirect("/app/categorias");
}

export async function deleteCategoria(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("delete_categoria", { p_id: id }));
  revalidatePath("/app/categorias");
}
