"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompetenceDate, getExpenseStatus, parseCurrency } from "@/lib/expenses";
import { setFlashMessage } from "@/lib/flash";
import { randomCardColor } from "@/lib/income-cards";
import { requireAuthenticatedUser } from "@/lib/user-data";
import { withTransactionRetry } from "@/services/transaction.service";

function optionalUuid(value: FormDataEntryValue | null) {
  const parsed = String(value || "");
  return parsed ? parsed : null;
}

export async function createCartao(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  const limite = parseCurrency(formData.get("limite"));
  if (!nome) {
    await setFlashMessage("error", "Informe um nome valido para o cartao.");
    redirect("/app/cartoes/novo");
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("create_cartao", {
    p_cor: randomCardColor(),
    p_limite: limite > 0 ? limite : null,
    p_nome: nome
  }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    redirect("/app/cartoes/novo");
  }
  await setFlashMessage("success", "Cartao salvo com sucesso.");
  revalidatePath("/app/cartoes");
  redirect("/app/cartoes");
}

export async function updateCartao(formData: FormData) {
  const id = String(formData.get("id") || "");
  const nome = String(formData.get("nome") || "").trim();
  const limite = parseCurrency(formData.get("limite"));
  if (!id || !nome) {
    await setFlashMessage("error", "Nao foi possivel salvar o cartao.");
    redirect(id ? `/app/cartoes/${id}/editar` : "/app/cartoes");
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("update_cartao", { p_id: id, p_limite: limite > 0 ? limite : null, p_nome: nome }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    redirect(`/app/cartoes/${id}/editar`);
  }
  await setFlashMessage("success", "Cartao atualizado com sucesso.");
  revalidatePath("/app/cartoes");
  redirect("/app/cartoes");
}

export async function deleteCartao(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("delete_cartao", { p_id: id }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    revalidatePath("/app/cartoes");
    return;
  }
  await setFlashMessage("success", "Cartao excluido com sucesso.");
  revalidatePath("/app/cartoes");
}

export async function createCartaoDespesa(formData: FormData) {
  const cartaoId = String(formData.get("cartao_id") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));
  if (!cartaoId || !descricao || valor <= 0) {
    await setFlashMessage("error", "Preencha descricao e valor validos para a despesa do cartao.");
    redirect(cartaoId ? `/app/cartoes/${cartaoId}/despesas/nova` : "/app/cartoes");
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("create_cartao_despesa", {
    p_cartao_id: cartaoId,
    p_categoria_id: optionalUuid(formData.get("categoria_id")),
    p_data_competencia: getCompetenceDate(formData.get("data_competencia")),
    p_descricao: descricao,
    p_status: getExpenseStatus(formData.get("status")),
    p_valor: valor
  }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    redirect(`/app/cartoes/${cartaoId}/despesas/nova`);
  }
  await setFlashMessage("success", "Despesa do cartao salva com sucesso.");
  revalidatePath(`/app/cartoes/${cartaoId}/despesas`);
  revalidatePath("/app/cartoes");
  redirect(`/app/cartoes/${cartaoId}/despesas`);
}

export async function updateCartaoDespesa(formData: FormData) {
  const id = String(formData.get("id") || "");
  const cartaoId = String(formData.get("cartao_id") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));
  if (!id || !cartaoId || !descricao || valor <= 0) {
    await setFlashMessage("error", "Nao foi possivel salvar a despesa do cartao.");
    redirect(id && cartaoId ? `/app/cartoes/${cartaoId}/despesas/${id}/editar` : "/app/cartoes");
  }

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("update_cartao_despesa", {
    p_cartao_id: cartaoId,
    p_categoria_id: optionalUuid(formData.get("categoria_id")),
    p_data_competencia: getCompetenceDate(formData.get("data_competencia")),
    p_descricao: descricao,
    p_id: id,
    p_status: getExpenseStatus(formData.get("status")),
    p_valor: valor
  }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    redirect(`/app/cartoes/${cartaoId}/despesas/${id}/editar`);
  }
  await setFlashMessage("success", "Despesa do cartao atualizada com sucesso.");
  revalidatePath(`/app/cartoes/${cartaoId}/despesas`);
  revalidatePath("/app/cartoes");
  redirect(`/app/cartoes/${cartaoId}/despesas`);
}

export async function deleteCartaoDespesa(formData: FormData) {
  const id = String(formData.get("id") || "");
  const cartaoId = String(formData.get("cartao_id") || "");
  if (!id || !cartaoId) return;

  const { supabase } = await requireAuthenticatedUser();
  const result = await withTransactionRetry(() => supabase.rpc("delete_cartao_despesa", { p_cartao_id: cartaoId, p_id: id }));
  if (result.error) {
    await setFlashMessage("error", result.error.message);
    revalidatePath(`/app/cartoes/${cartaoId}/despesas`);
    revalidatePath("/app/cartoes");
    return;
  }
  await setFlashMessage("success", "Despesa do cartao excluida com sucesso.");
  revalidatePath(`/app/cartoes/${cartaoId}/despesas`);
  revalidatePath("/app/cartoes");
}
