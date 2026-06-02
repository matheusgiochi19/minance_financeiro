"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompetenceDate, getExpenseStatus, parseCurrency } from "@/lib/expenses";
import { randomCardColor } from "@/lib/income-cards";
import { withUiAlert } from "@/lib/ui-alert";
import { requireAuthenticatedUser } from "@/lib/user-data";
import {
  buildRecurringDates,
  cancelLedgerRows,
  clampRepeatMonths,
  createRecurrenceGroup,
  getRecurrenceScope,
  validateCartaoDespesaRelations,
  writeLedgerRows
} from "@/services/recurrence.service";
import { withTransactionRetry } from "@/services/transaction.service";

function optionalUuid(value: FormDataEntryValue | null) {
  const parsed = String(value || "");
  return parsed ? parsed : null;
}

export async function createCartao(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  const limite = parseCurrency(formData.get("limite"));
  if (!nome) return;

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() =>
    supabase.rpc("create_cartao", {
      p_cor: randomCardColor(),
      p_limite: limite > 0 ? limite : null,
      p_nome: nome
    })
  );
  revalidatePath("/app/cartoes");
  redirect(withUiAlert("/app/cartoes", "success", "Cartao salvo com sucesso."));
}

export async function updateCartao(formData: FormData) {
  const id = String(formData.get("id") || "");
  const nome = String(formData.get("nome") || "").trim();
  const limite = parseCurrency(formData.get("limite"));
  if (!id || !nome) return;

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("update_cartao", { p_id: id, p_limite: limite > 0 ? limite : null, p_nome: nome }));
  revalidatePath("/app/cartoes");
  redirect(withUiAlert("/app/cartoes", "success", "Cartao atualizado com sucesso."));
}

export async function deleteCartao(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { supabase } = await requireAuthenticatedUser();
  await withTransactionRetry(() => supabase.rpc("delete_cartao", { p_id: id }));
  revalidatePath("/app/cartoes");
  redirect(withUiAlert("/app/cartoes", "success", "Cartao excluido com sucesso."));
}

async function insertCartaoDespesas(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  userId: string,
  rows: Array<{
    cartao_id: string;
    categoria_id: string | null;
    data_competencia: string;
    descricao: string;
    recurrence_group_id: string | null;
    status: "p" | "pp" | "ab";
    user_id: string;
    valor: number;
  }>
) {
  const { data, error } = await supabase
    .from("cartao_despesas")
    .insert(rows)
    .select("id,valor,data_competencia");

  if (error || !data) {
    throw new Error(error?.message || "Nao foi possivel salvar a despesa do cartao.");
  }

  await writeLedgerRows(
    supabase,
    userId,
    "cartao_despesa",
    data.map((item) => ({ data_competencia: item.data_competencia, entidade_id: item.id, valor: Number(item.valor || 0) }))
  );
}

async function deleteCartaoDespesas(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  userId: string,
  rows: Array<{ id: string }>
) {
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("cartao_despesas")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  await cancelLedgerRows(supabase, userId, "cartao_despesa", ids);
}

export async function createCartaoDespesa(formData: FormData) {
  const cartaoId = String(formData.get("cartao_id") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));
  const repeatMonths = clampRepeatMonths(formData.get("repeat_months"));
  const categoriaId = optionalUuid(formData.get("categoria_id"));
  const dataCompetencia = getCompetenceDate(formData.get("data_competencia"));
  const status = getExpenseStatus(formData.get("status"));

  if (!cartaoId || !descricao || valor <= 0) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await validateCartaoDespesaRelations(supabase, user.id, cartaoId, categoriaId);
  const recurrenceGroupId = repeatMonths > 1 ? await createRecurrenceGroup(supabase, user.id, "despesa_cartao") : null;
  const dates = buildRecurringDates(dataCompetencia, repeatMonths);

  try {
    await insertCartaoDespesas(
      supabase,
      user.id,
      dates.map((date) => ({
        cartao_id: cartaoId,
        categoria_id: categoriaId,
        data_competencia: date,
        descricao,
        recurrence_group_id: recurrenceGroupId,
        status,
        user_id: user.id,
        valor
      }))
    );
  } catch (error) {
    if (recurrenceGroupId) {
      await supabase.from("recurrence_groups").delete().eq("id", recurrenceGroupId).eq("user_id", user.id);
    }
    throw error;
  }

  revalidatePath(`/app/cartoes/${cartaoId}/despesas`);
  revalidatePath("/app/cartoes");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert(`/app/cartoes/${cartaoId}/despesas`, "success", "Despesa do cartao salva com sucesso."));
}

export async function updateCartaoDespesa(formData: FormData) {
  const id = String(formData.get("id") || "");
  const cartaoId = String(formData.get("cartao_id") || "");
  const scope = getRecurrenceScope(formData.get("scope"));
  const recurrenceGroupId = String(formData.get("recurrence_group_id") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));
  const categoriaId = optionalUuid(formData.get("categoria_id"));
  const dataCompetencia = getCompetenceDate(formData.get("data_competencia"));
  const status = getExpenseStatus(formData.get("status"));

  if (!id || !cartaoId || !descricao || valor <= 0) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await validateCartaoDespesaRelations(supabase, user.id, cartaoId, categoriaId);

  if (scope === "all" && recurrenceGroupId) {
    const { data: rows, error } = await supabase
      .from("cartao_despesas")
      .select("id,data_competencia")
      .eq("user_id", user.id)
      .eq("recurrence_group_id", recurrenceGroupId)
      .is("deleted_at", null)
      .order("data_competencia", { ascending: true })
      .returns<Array<{ data_competencia: string; id: string }>>();

    if (error || !rows?.length) {
      throw new Error(error?.message || "Lancamentos recorrentes nao encontrados.");
    }

    const { error: updateError } = await supabase
      .from("cartao_despesas")
      .update({
        cartao_id: cartaoId,
        categoria_id: categoriaId,
        descricao,
        status,
        updated_at: new Date().toISOString(),
        valor
      })
      .eq("user_id", user.id)
      .eq("recurrence_group_id", recurrenceGroupId)
      .is("deleted_at", null);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await cancelLedgerRows(supabase, user.id, "cartao_despesa", rows.map((row) => row.id));
    await writeLedgerRows(
      supabase,
      user.id,
      "cartao_despesa",
      rows.map((row) => ({ data_competencia: row.data_competencia, entidade_id: row.id, valor }))
    );
  } else {
    const { error: updateError } = await supabase
      .from("cartao_despesas")
      .update({
        cartao_id: cartaoId,
        categoria_id: categoriaId,
        data_competencia: dataCompetencia,
        descricao,
        status,
        updated_at: new Date().toISOString(),
        valor
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await cancelLedgerRows(supabase, user.id, "cartao_despesa", [id]);
    await writeLedgerRows(supabase, user.id, "cartao_despesa", [{ data_competencia: dataCompetencia, entidade_id: id, valor }]);
  }

  revalidatePath(`/app/cartoes/${cartaoId}/despesas`);
  revalidatePath("/app/cartoes");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert(`/app/cartoes/${cartaoId}/despesas`, "success", "Despesa do cartao atualizada com sucesso."));
}

export async function deleteCartaoDespesa(formData: FormData) {
  const id = String(formData.get("id") || "");
  const cartaoId = String(formData.get("cartao_id") || "");
  const scope = getRecurrenceScope(formData.get("scope"));
  const recurrenceGroupId = String(formData.get("recurrence_group_id") || "");

  if (!id || !cartaoId) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();

  if (scope === "all" && recurrenceGroupId) {
    const { data: rows, error } = await supabase
      .from("cartao_despesas")
      .select("id")
      .eq("user_id", user.id)
      .eq("recurrence_group_id", recurrenceGroupId)
      .is("deleted_at", null)
      .returns<Array<{ id: string }>>();

    if (error) {
      throw new Error(error.message);
    }

    await deleteCartaoDespesas(supabase, user.id, rows || []);
  } else {
    await deleteCartaoDespesas(supabase, user.id, [{ id }]);
  }

  revalidatePath(`/app/cartoes/${cartaoId}/despesas`);
  revalidatePath("/app/cartoes");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert(`/app/cartoes/${cartaoId}/despesas`, "success", "Despesa do cartao excluida com sucesso."));
}
