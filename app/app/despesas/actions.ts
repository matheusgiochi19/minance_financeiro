"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompetenceDate, parseCurrency, getExpenseStatus } from "@/lib/expenses";
import { setFlashMessage } from "@/lib/flash";
import { requireAuthenticatedUser } from "@/lib/user-data";
import { withTransactionRetry } from "@/services/transaction.service";

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

function optionalUuid(value: FormDataEntryValue | null) {
  const parsed = String(value || "");
  return parsed ? parsed : null;
}

async function uploadAttachment(formData: FormData, userId: string) {
  const file = formData.get("anexo");

  if (!(file instanceof File) || file.size === 0) {
    return { path: null, name: null };
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("O anexo deve ter no máximo 50MB.");
  }

  const { supabase } = await requireAuthenticatedUser();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("despesas-anexos").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return { path, name: file.name };
}

export async function createDespesa(formData: FormData) {
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));

  if (!descricao || valor <= 0) {
    await setFlashMessage("error", "Preencha descricao e valor validos para a despesa.");
    redirect("/app/despesas/nova");
  }

  const { supabase, user } = await requireAuthenticatedUser();
  const attachment = await uploadAttachment(formData, user.id);

  const { error } = await withTransactionRetry(() => supabase.rpc("create_despesa", {
    p_anexo_nome: attachment.name,
    p_anexo_path: attachment.path,
    p_bolso_id: optionalUuid(formData.get("bolso_id")),
    p_categoria_id: optionalUuid(formData.get("categoria_id")),
    p_data_competencia: getCompetenceDate(formData.get("data_competencia")),
    p_descricao: descricao,
    p_status: getExpenseStatus(formData.get("status")),
    p_valor: valor
  }));

  if (error && attachment.path) {
    await supabase.storage.from("despesas-anexos").remove([attachment.path]);
  }
  if (error) {
    await setFlashMessage("error", error.message);
    redirect("/app/despesas/nova");
  }

  await setFlashMessage("success", "Despesa salva com sucesso.");
  revalidatePath("/app/despesas");
  redirect("/app/despesas");
}

export async function updateDespesa(formData: FormData) {
  const id = String(formData.get("id") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));

  if (!id || !descricao || valor <= 0) {
    await setFlashMessage("error", "Nao foi possivel salvar a despesa.");
    redirect(id ? `/app/despesas/${id}/editar` : "/app/despesas");
  }

  const { supabase, user } = await requireAuthenticatedUser();
  const attachment = await uploadAttachment(formData, user.id);

  const { error } = await withTransactionRetry(() => supabase.rpc("update_despesa", {
    p_anexo_nome: attachment.name,
    p_anexo_path: attachment.path,
    p_bolso_id: optionalUuid(formData.get("bolso_id")),
    p_categoria_id: optionalUuid(formData.get("categoria_id")),
    p_data_competencia: getCompetenceDate(formData.get("data_competencia")),
    p_descricao: descricao,
    p_id: id,
    p_status: getExpenseStatus(formData.get("status")),
    p_valor: valor
  }));

  if (error && attachment.path) {
    await supabase.storage.from("despesas-anexos").remove([attachment.path]);
  }
  if (error) {
    await setFlashMessage("error", error.message);
    redirect(`/app/despesas/${id}/editar`);
  }

  await setFlashMessage("success", "Despesa atualizada com sucesso.");
  revalidatePath("/app/despesas");
  redirect("/app/despesas");
}

export async function deleteDespesa(formData: FormData) {
  const id = String(formData.get("id") || "");
  const anexoPath = String(formData.get("anexo_path") || "");

  if (!id) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("delete_despesa", { p_id: id }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    revalidatePath("/app/despesas");
    return;
  }

  if (anexoPath) {
    await supabase.storage.from("despesas-anexos").remove([anexoPath]);
  }

  await setFlashMessage("success", "Despesa excluida com sucesso.");
  revalidatePath("/app/despesas");
}

export async function markDespesaAsPaid(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("mark_despesa_paid", { p_id: id }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    revalidatePath("/app/despesas");
    return;
  }
  await setFlashMessage("success", "Despesa marcada como paga.");
  revalidatePath("/app/despesas");
}
