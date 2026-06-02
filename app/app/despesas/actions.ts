"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompetenceDate, getExpenseStatus, parseCurrency } from "@/lib/expenses";
import { withUiAlert } from "@/lib/ui-alert";
import { requireAuthenticatedUser } from "@/lib/user-data";
import {
  buildRecurringDates,
  cancelLedgerRows,
  clampRepeatMonths,
  createRecurrenceGroup,
  getRecurrenceScope,
  validateDespesaRelations,
  writeLedgerRows
} from "@/services/recurrence.service";

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

function optionalUuid(value: FormDataEntryValue | null) {
  const parsed = String(value || "");
  return parsed ? parsed : null;
}

async function uploadAttachment(
  formData: FormData,
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  userId: string
) {
  const file = formData.get("anexo");

  if (!(file instanceof File) || file.size === 0) {
    return { name: null, path: null };
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("O anexo deve ter no maximo 50MB.");
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("despesas-anexos").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return { name: file.name, path };
}

async function insertDespesaRows(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  userId: string,
  rows: Array<{
    anexo_nome: string | null;
    anexo_path: string | null;
    bolso_id: string | null;
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
    .from("despesas")
    .insert(rows)
    .select("id,valor,data_competencia");

  if (error || !data) {
    throw new Error(error?.message || "Nao foi possivel salvar a despesa.");
  }

  await writeLedgerRows(
    supabase,
    userId,
    "despesa",
    data.map((item) => ({ data_competencia: item.data_competencia, entidade_id: item.id, valor: Number(item.valor || 0) }))
  );

  return data;
}

async function deleteAttachmentIfUnused(supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"], userId: string, path: string | null) {
  if (!path) {
    return;
  }

  const { count, error } = await supabase
    .from("despesas")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("anexo_path", path)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  if ((count || 0) === 0) {
    await supabase.storage.from("despesas-anexos").remove([path]);
  }
}

async function deleteDespesaRows(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  userId: string,
  rows: Array<{ id: string }>
) {
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("despesas")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  await cancelLedgerRows(supabase, userId, "despesa", ids);
}

export async function createDespesa(formData: FormData) {
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));
  const repeatMonths = clampRepeatMonths(formData.get("repeat_months"));
  const dataCompetencia = getCompetenceDate(formData.get("data_competencia"));
  const categoriaId = optionalUuid(formData.get("categoria_id"));
  const bolsoId = optionalUuid(formData.get("bolso_id"));
  const status = getExpenseStatus(formData.get("status"));

  if (!descricao || valor <= 0) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await validateDespesaRelations(supabase, user.id, categoriaId, bolsoId);
  const attachment = await uploadAttachment(formData, supabase, user.id);
  const recurrenceGroupId = repeatMonths > 1 ? await createRecurrenceGroup(supabase, user.id, "despesa") : null;
  const dates = buildRecurringDates(dataCompetencia, repeatMonths);

  try {
    await insertDespesaRows(
      supabase,
      user.id,
      dates.map((date) => ({
        anexo_nome: attachment.name,
        anexo_path: attachment.path,
        bolso_id: bolsoId,
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
    if (attachment.path) {
      await supabase.storage.from("despesas-anexos").remove([attachment.path]);
    }
    if (recurrenceGroupId) {
      await supabase.from("recurrence_groups").delete().eq("id", recurrenceGroupId).eq("user_id", user.id);
    }
    throw error;
  }

  revalidatePath("/app/despesas");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert("/app/despesas", "success", "Despesa salva com sucesso."));
}

export async function updateDespesa(formData: FormData) {
  const id = String(formData.get("id") || "");
  const scope = getRecurrenceScope(formData.get("scope"));
  const recurrenceGroupId = String(formData.get("recurrence_group_id") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));
  const dataCompetencia = getCompetenceDate(formData.get("data_competencia"));
  const categoriaId = optionalUuid(formData.get("categoria_id"));
  const bolsoId = optionalUuid(formData.get("bolso_id"));
  const status = getExpenseStatus(formData.get("status"));

  if (!id || !descricao || valor <= 0) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await validateDespesaRelations(supabase, user.id, categoriaId, bolsoId);
  const attachment = await uploadAttachment(formData, supabase, user.id);
  const attachmentFields = attachment.path ? { anexo_nome: attachment.name, anexo_path: attachment.path } : {};

  if (scope === "all" && recurrenceGroupId) {
    const { data: rows, error } = await supabase
      .from("despesas")
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
      .from("despesas")
      .update({
        bolso_id: bolsoId,
        categoria_id: categoriaId,
        descricao,
        status,
        updated_at: new Date().toISOString(),
        valor,
        ...attachmentFields
      })
      .eq("user_id", user.id)
      .eq("recurrence_group_id", recurrenceGroupId)
      .is("deleted_at", null);

    if (updateError) {
      if (attachment.path) {
        await supabase.storage.from("despesas-anexos").remove([attachment.path]);
      }
      throw new Error(updateError.message);
    }

    await cancelLedgerRows(supabase, user.id, "despesa", rows.map((row) => row.id));
    await writeLedgerRows(
      supabase,
      user.id,
      "despesa",
      rows.map((row) => ({ data_competencia: row.data_competencia, entidade_id: row.id, valor }))
    );
  } else {
    const { error: updateError } = await supabase
      .from("despesas")
      .update({
        bolso_id: bolsoId,
        categoria_id: categoriaId,
        data_competencia: dataCompetencia,
        descricao,
        status,
        updated_at: new Date().toISOString(),
        valor,
        ...attachmentFields
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (updateError) {
      if (attachment.path) {
        await supabase.storage.from("despesas-anexos").remove([attachment.path]);
      }
      throw new Error(updateError.message);
    }

    await cancelLedgerRows(supabase, user.id, "despesa", [id]);
    await writeLedgerRows(supabase, user.id, "despesa", [{ data_competencia: dataCompetencia, entidade_id: id, valor }]);
  }

  revalidatePath("/app/despesas");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert("/app/despesas", "success", "Despesa atualizada com sucesso."));
}

export async function deleteDespesa(formData: FormData) {
  const id = String(formData.get("id") || "");
  const scope = getRecurrenceScope(formData.get("scope"));
  const recurrenceGroupId = String(formData.get("recurrence_group_id") || "");
  const anexoPath = String(formData.get("anexo_path") || "");

  if (!id) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();

  if (scope === "all" && recurrenceGroupId) {
    const { data: rows, error } = await supabase
      .from("despesas")
      .select("id")
      .eq("user_id", user.id)
      .eq("recurrence_group_id", recurrenceGroupId)
      .is("deleted_at", null)
      .returns<Array<{ id: string }>>();

    if (error) {
      throw new Error(error.message);
    }

    await deleteDespesaRows(supabase, user.id, rows || []);
  } else {
    await deleteDespesaRows(supabase, user.id, [{ id }]);
  }

  await deleteAttachmentIfUnused(supabase, user.id, anexoPath || null);

  revalidatePath("/app/despesas");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert("/app/despesas", "success", "Despesa excluida com sucesso."));
}

export async function markDespesaAsPaid(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("mark_despesa_paid", {
    p_id: id
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/despesas");
  revalidatePath("/app/dashboard");
  redirect(withUiAlert("/app/despesas", "success", "Despesa marcada como paga."));
}
