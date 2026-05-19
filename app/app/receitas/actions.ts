"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompetenceDate, parseCurrency } from "@/lib/expenses";
import { withUiAlert } from "@/lib/ui-alert";
import { requireAuthenticatedUser } from "@/lib/user-data";
import { withTransactionRetry } from "@/services/transaction.service";

function optionalUuid(value: FormDataEntryValue | null) {
  const parsed = String(value || "");
  return parsed ? parsed : null;
}

export async function createReceita(formData: FormData) {
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));

  if (!descricao || valor <= 0) return;

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("create_receita", {
    p_bolso_id: optionalUuid(formData.get("bolso_id")),
    p_categoria_id: optionalUuid(formData.get("categoria_id")),
    p_data_competencia: getCompetenceDate(formData.get("data_competencia")),
    p_descricao: descricao,
    p_valor: valor
  }));
  revalidatePath("/app/receitas");
  redirect(withUiAlert("/app/receitas", "success", "Receita salva com sucesso."));
}

export async function updateReceita(formData: FormData) {
  const id = String(formData.get("id") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));

  if (!id || !descricao || valor <= 0) return;

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("update_receita", {
    p_bolso_id: optionalUuid(formData.get("bolso_id")),
    p_categoria_id: optionalUuid(formData.get("categoria_id")),
    p_data_competencia: getCompetenceDate(formData.get("data_competencia")),
    p_descricao: descricao,
    p_id: id,
    p_valor: valor
  }));
  revalidatePath("/app/receitas");
  redirect(withUiAlert("/app/receitas", "success", "Receita atualizada com sucesso."));
}

export async function deleteReceita(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("delete_receita", { p_id: id }));
  revalidatePath("/app/receitas");
  redirect(withUiAlert("/app/receitas", "success", "Receita excluida com sucesso."));
}
