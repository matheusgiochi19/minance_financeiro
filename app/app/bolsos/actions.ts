"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeName, requireAuthenticatedUser } from "@/lib/user-data";
import { withTransactionRetry } from "@/services/transaction.service";

export async function createBolso(formData: FormData) {
  const nome = normalizeName(formData);

  if (!nome) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("create_bolso", { p_nome: nome }));
  revalidatePath("/app/bolsos");
  redirect("/app/bolsos");
}

export async function updateBolso(formData: FormData) {
  const id = String(formData.get("id") || "");
  const nome = normalizeName(formData);

  if (!id || !nome) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("update_bolso", { p_id: id, p_nome: nome }));
  revalidatePath("/app/bolsos");
  redirect("/app/bolsos");
}

export async function deleteBolso(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("delete_bolso", { p_id: id }));
  revalidatePath("/app/bolsos");
}
