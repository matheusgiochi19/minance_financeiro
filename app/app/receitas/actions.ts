"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompetenceDate, parseCurrency } from "@/lib/expenses";
import { withUiAlert } from "@/lib/ui-alert";
import { requireAuthenticatedUser } from "@/lib/user-data";
import {
  buildRecurringDates,
  cancelLedgerRows,
  clampRepeatMonths,
  createRecurrenceGroup,
  getRecurrenceScope,
  validateReceitaRelations,
  writeLedgerRows
} from "@/services/recurrence.service";

function optionalUuid(value: FormDataEntryValue | null) {
  const parsed = String(value || "");
  return parsed ? parsed : null;
}

async function insertReceitas(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  userId: string,
  rows: Array<{
    bolso_id: string | null;
    categoria_id: string | null;
    data_competencia: string;
    descricao: string;
    recurrence_group_id: string | null;
    user_id: string;
    valor: number;
  }>
) {
  const { data, error } = await supabase
    .from("receitas")
    .insert(rows)
    .select("id,valor,data_competencia");

  if (error || !data) {
    throw new Error(error?.message || "Nao foi possivel salvar a receita.");
  }

  await writeLedgerRows(
    supabase,
    userId,
    "receita",
    data.map((item) => ({ data_competencia: item.data_competencia, entidade_id: item.id, valor: Number(item.valor || 0) }))
  );

  return data;
}

async function deleteReceitaRows(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  userId: string,
  rows: Array<{ id: string }>
) {
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("receitas")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  await cancelLedgerRows(supabase, userId, "receita", ids);
}

export async function createReceita(formData: FormData) {
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));
  const repeatMonths = clampRepeatMonths(formData.get("repeat_months"));
  const dataCompetencia = getCompetenceDate(formData.get("data_competencia"));
  const categoriaId = optionalUuid(formData.get("categoria_id"));
  const bolsoId = optionalUuid(formData.get("bolso_id"));

  if (!descricao || valor <= 0) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await validateReceitaRelations(supabase, user.id, categoriaId, bolsoId);

  const recurrenceGroupId = repeatMonths > 1 ? await createRecurrenceGroup(supabase, user.id, "receita") : null;
  const dates = buildRecurringDates(dataCompetencia, repeatMonths);

  try {
    await insertReceitas(
      supabase,
      user.id,
      dates.map((date) => ({
        bolso_id: bolsoId,
        categoria_id: categoriaId,
        data_competencia: date,
        descricao,
        recurrence_group_id: recurrenceGroupId,
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

  revalidatePath("/app/receitas");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert("/app/receitas", "success", "Receita salva com sucesso."));
}

export async function updateReceita(formData: FormData) {
  const id = String(formData.get("id") || "");
  const scope = getRecurrenceScope(formData.get("scope"));
  const recurrenceGroupId = String(formData.get("recurrence_group_id") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));
  const dataCompetencia = getCompetenceDate(formData.get("data_competencia"));
  const categoriaId = optionalUuid(formData.get("categoria_id"));
  const bolsoId = optionalUuid(formData.get("bolso_id"));

  if (!id || !descricao || valor <= 0) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await validateReceitaRelations(supabase, user.id, categoriaId, bolsoId);

  if (scope === "all" && recurrenceGroupId) {
    const { data: rows, error } = await supabase
      .from("receitas")
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
      .from("receitas")
      .update({
        bolso_id: bolsoId,
        categoria_id: categoriaId,
        descricao,
        updated_at: new Date().toISOString(),
        valor
      })
      .eq("user_id", user.id)
      .eq("recurrence_group_id", recurrenceGroupId)
      .is("deleted_at", null);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await cancelLedgerRows(supabase, user.id, "receita", rows.map((row) => row.id));
    await writeLedgerRows(
      supabase,
      user.id,
      "receita",
      rows.map((row) => ({ data_competencia: row.data_competencia, entidade_id: row.id, valor }))
    );
  } else {
    const { error: updateError } = await supabase
      .from("receitas")
      .update({
        bolso_id: bolsoId,
        categoria_id: categoriaId,
        data_competencia: dataCompetencia,
        descricao,
        updated_at: new Date().toISOString(),
        valor
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await cancelLedgerRows(supabase, user.id, "receita", [id]);
    await writeLedgerRows(supabase, user.id, "receita", [{ data_competencia: dataCompetencia, entidade_id: id, valor }]);
  }

  revalidatePath("/app/receitas");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert("/app/receitas", "success", "Receita atualizada com sucesso."));
}

export async function deleteReceita(formData: FormData) {
  const id = String(formData.get("id") || "");
  const scope = getRecurrenceScope(formData.get("scope"));
  const recurrenceGroupId = String(formData.get("recurrence_group_id") || "");

  if (!id) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();

  if (scope === "all" && recurrenceGroupId) {
    const { data: rows, error } = await supabase
      .from("receitas")
      .select("id")
      .eq("user_id", user.id)
      .eq("recurrence_group_id", recurrenceGroupId)
      .is("deleted_at", null)
      .returns<Array<{ id: string }>>();

    if (error) {
      throw new Error(error.message);
    }

    await deleteReceitaRows(supabase, user.id, rows || []);
  } else {
    await deleteReceitaRows(supabase, user.id, [{ id }]);
  }

  revalidatePath("/app/receitas");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert("/app/receitas", "success", "Receita excluida com sucesso."));
}
