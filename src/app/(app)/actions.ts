"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth";

type MovimentoTipo = "receita" | "despesa";
type RecurrenceScope = "single" | "all";

function clampRepeatMonths(value: FormDataEntryValue | null) {
  const repeat = Number(value ?? 1);

  if (!Number.isFinite(repeat)) {
    return 1;
  }

  return Math.min(Math.max(Math.trunc(repeat), 1), 24);
}

function addMonths(dateValue: string, monthsToAdd: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const targetMonth = month - 1 + monthsToAdd;
  const lastDay = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
  const safeDay = Math.min(day, lastDay);
  const date = new Date(Date.UTC(year, targetMonth, safeDay));

  return date.toISOString().slice(0, 10);
}

function getNullableString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getMovementBaseFields(formData: FormData) {
  return {
    descricao: String(formData.get("descricao") ?? "").trim(),
    valor: Number(formData.get("valor") ?? 0),
    categoriaId: getNullableString(formData, "categoria_id"),
    bolsoId: getNullableString(formData, "bolso_id"),
    cartaoId: getNullableString(formData, "cartao_id"),
    observacoes: getNullableString(formData, "observacoes"),
  };
}

export async function createCategoriaAction(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "despesa");
  const cor = String(formData.get("cor") ?? "#A35139");

  if (!nome) {
    return;
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return;
  }

  await supabase.from("categorias").insert({
    user_id: user.id,
    nome,
    tipo,
    cor,
  });

  revalidatePath("/categorias");
  revalidatePath("/dashboard");
}

export async function deleteCategoriaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return;
  }

  await supabase.from("categorias").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/categorias");
  revalidatePath("/dashboard");
}

export async function createMovimentoAction(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "despesa") as MovimentoTipo;
  const status = String(formData.get("status") ?? "pendente");
  const data = String(formData.get("data") ?? "");
  const repeatMonths = clampRepeatMonths(formData.get("repeat_months"));
  const { descricao, valor, categoriaId, bolsoId, cartaoId, observacoes } =
    getMovementBaseFields(formData);

  if (!descricao || !valor || !data) {
    return;
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return;
  }

  let recurrenceGroupId: string | null = null;

  if (repeatMonths > 1) {
    const { data: group } = await supabase
      .from("recurrence_groups")
      .insert({
        user_id: user.id,
        type: tipo === "receita" ? "receita" : cartaoId ? "despesa_cartao" : "despesa",
      })
      .select("id")
      .single();

    recurrenceGroupId = group?.id ?? null;
  }

  const dates = Array.from({ length: repeatMonths }, (_, index) => addMonths(data, index));

  if (tipo === "receita") {
    await supabase.from("receitas").insert(
      dates.map((date) => ({
        user_id: user.id,
        descricao,
        valor,
        data_recebimento: date,
        categoria_id: categoriaId,
        bolso_id: bolsoId,
        observacoes,
        recurrence_group_id: recurrenceGroupId,
      })),
    );
  } else {
    const { data: despesas } = await supabase
      .from("despesas")
      .insert(
        dates.map((date) => ({
          user_id: user.id,
          status,
          descricao,
          valor,
          data_despesa: date,
          categoria_id: categoriaId,
          bolso_id: bolsoId,
          cartao_id: cartaoId,
          observacoes,
          recurrence_group_id: recurrenceGroupId,
        })),
      )
      .select("id, data_despesa");

    if (cartaoId && despesas?.length) {
      await supabase.from("cartao_despesas").insert(
        despesas.map((despesa) => ({
          user_id: user.id,
          despesa_id: despesa.id,
          cartao_id: cartaoId,
          competencia: String(despesa.data_despesa).slice(0, 7),
          parcela_atual: 1,
          parcelas_totais: 1,
          recurrence_group_id: recurrenceGroupId,
        })),
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/despesas");
}

export async function updateMovimentoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const tipo = String(formData.get("tipo") ?? "despesa") as MovimentoTipo;
  const scope = String(formData.get("scope") ?? "single") as RecurrenceScope;
  const recurrenceGroupId = getNullableString(formData, "recurrence_group_id");
  const { descricao, valor, categoriaId, bolsoId, cartaoId, observacoes } =
    getMovementBaseFields(formData);

  if (!id || !descricao || !valor) {
    return;
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return;
  }

  const shouldUpdateAll = scope === "all" && recurrenceGroupId;

  if (tipo === "receita") {
    const query = supabase
      .from("receitas")
      .update({
        descricao,
        valor,
        categoria_id: categoriaId,
        bolso_id: bolsoId,
        observacoes,
      })
      .eq("user_id", user.id);

    if (shouldUpdateAll) {
      await query.eq("recurrence_group_id", recurrenceGroupId);
    } else {
      await query.eq("id", id);
    }
  } else {
    const query = supabase
      .from("despesas")
      .update({
        descricao,
        valor,
        categoria_id: categoriaId,
        bolso_id: bolsoId,
        cartao_id: cartaoId,
        observacoes,
      })
      .eq("user_id", user.id);

    if (shouldUpdateAll) {
      await query.eq("recurrence_group_id", recurrenceGroupId);

      if (cartaoId) {
        const { data: despesas } = await supabase
          .from("despesas")
          .select("id, data_despesa, recurrence_group_id")
          .eq("user_id", user.id)
          .eq("recurrence_group_id", recurrenceGroupId);

        if (despesas?.length) {
          await supabase.from("cartao_despesas").upsert(
            despesas.map((despesa) => ({
              user_id: user.id,
              despesa_id: despesa.id,
              cartao_id: cartaoId,
              competencia: String(despesa.data_despesa).slice(0, 7),
              parcela_atual: 1,
              parcelas_totais: 1,
              recurrence_group_id: despesa.recurrence_group_id,
            })),
            { onConflict: "despesa_id" },
          );
        }
      } else {
        await supabase
          .from("cartao_despesas")
          .delete()
          .eq("user_id", user.id)
          .eq("recurrence_group_id", recurrenceGroupId);
      }
    } else {
      await query.eq("id", id);

      if (cartaoId) {
        const { data: despesa } = await supabase
          .from("despesas")
          .select("id, data_despesa, recurrence_group_id")
          .eq("user_id", user.id)
          .eq("id", id)
          .single();

        if (despesa) {
          await supabase.from("cartao_despesas").upsert(
            {
              user_id: user.id,
              despesa_id: despesa.id,
              cartao_id: cartaoId,
              competencia: String(despesa.data_despesa).slice(0, 7),
              parcela_atual: 1,
              parcelas_totais: 1,
              recurrence_group_id: despesa.recurrence_group_id,
            },
            { onConflict: "despesa_id" },
          );
        }
      } else {
        await supabase
          .from("cartao_despesas")
          .delete()
          .eq("user_id", user.id)
          .eq("despesa_id", id);
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/despesas");
}

export async function deleteMovimentoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const tipo = String(formData.get("tipo") ?? "despesa") as MovimentoTipo;
  const scope = String(formData.get("scope") ?? "single") as RecurrenceScope;
  const recurrenceGroupId = getNullableString(formData, "recurrence_group_id");
  if (!id) {
    return;
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return;
  }

  const shouldDeleteAll = scope === "all" && recurrenceGroupId;

  if (tipo === "receita") {
    const query = supabase.from("receitas").delete().eq("user_id", user.id);

    if (shouldDeleteAll) {
      await query.eq("recurrence_group_id", recurrenceGroupId);
    } else {
      await query.eq("id", id);
    }
  } else if (shouldDeleteAll) {
    await supabase
      .from("cartao_despesas")
      .delete()
      .eq("user_id", user.id)
      .eq("recurrence_group_id", recurrenceGroupId);
    await supabase
      .from("despesas")
      .delete()
      .eq("user_id", user.id)
      .eq("recurrence_group_id", recurrenceGroupId);
  } else {
    await supabase.from("cartao_despesas").delete().eq("despesa_id", id).eq("user_id", user.id);
    await supabase.from("despesas").delete().eq("id", id).eq("user_id", user.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/despesas");
}
