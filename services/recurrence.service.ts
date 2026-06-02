import type { SupabaseClient } from "@supabase/supabase-js";

export type RecurrenceScope = "single" | "all";
export type RecurrenceKind = "receita" | "despesa" | "despesa_cartao";
export type LedgerOrigin = "receita" | "despesa" | "cartao_despesa";

export function clampRepeatMonths(value: FormDataEntryValue | null, fallback = 1, max = 120) {
  const parsed = Number(String(value || fallback).replace(",", "."));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

export function getRecurrenceScope(value: FormDataEntryValue | null): RecurrenceScope {
  return value === "all" ? "all" : "single";
}

export function buildRecurringDates(startDate: string, repeatMonths: number) {
  const source = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(source.getTime())) {
    return [startDate];
  }

  const year = source.getUTCFullYear();
  const month = source.getUTCMonth();
  const day = source.getUTCDate();

  return Array.from({ length: repeatMonths }, (_, index) => {
    const current = new Date(Date.UTC(year, month + index, 1));
    const lastDay = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0)).getUTCDate();
    current.setUTCDate(Math.min(day, lastDay));
    return current.toISOString().slice(0, 10);
  });
}

export async function createRecurrenceGroup(
  supabase: SupabaseClient,
  userId: string,
  type: RecurrenceKind
) {
  const { data, error } = await supabase
    .from("recurrence_groups")
    .insert({ type, user_id: userId })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error(error?.message || "Nao foi possivel criar o grupo de recorrencia.");
  }

  return data.id;
}

async function assertOwnedRelation(
  supabase: SupabaseClient,
  table: "categorias" | "bolsos" | "cartoes",
  id: string | null,
  userId: string,
  label: string
) {
  if (!id) {
    return;
  }

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    throw new Error(`${label} nao encontrado.`);
  }
}

export async function validateReceitaRelations(
  supabase: SupabaseClient,
  userId: string,
  categoriaId: string | null,
  bolsoId: string | null
) {
  await Promise.all([
    assertOwnedRelation(supabase, "categorias", categoriaId, userId, "Categoria"),
    assertOwnedRelation(supabase, "bolsos", bolsoId, userId, "Bolso")
  ]);
}

export async function validateDespesaRelations(
  supabase: SupabaseClient,
  userId: string,
  categoriaId: string | null,
  bolsoId: string | null
) {
  await validateReceitaRelations(supabase, userId, categoriaId, bolsoId);
}

export async function validateCartaoDespesaRelations(
  supabase: SupabaseClient,
  userId: string,
  cartaoId: string | null,
  categoriaId: string | null
) {
  await Promise.all([
    assertOwnedRelation(supabase, "cartoes", cartaoId, userId, "Cartao"),
    assertOwnedRelation(supabase, "categorias", categoriaId, userId, "Categoria")
  ]);
}

export async function writeLedgerRows(
  supabase: SupabaseClient,
  userId: string,
  origin: LedgerOrigin,
  rows: Array<{ entidade_id: string; valor: number; data_competencia: string }>
) {
  if (rows.length === 0) {
    return;
  }

  const tipo = origin === "receita" ? "entrada" : "saida";
  const errors = await Promise.all(
    rows.map(async (row) => {
      const { error } = await supabase.rpc("write_ledger", {
        p_data_competencia: row.data_competencia,
        p_entidade_id: row.entidade_id,
        p_entidade_origem: origin,
        p_tipo: tipo,
        p_user_id: userId,
        p_valor: row.valor
      });

      return error;
    })
  );

  const firstError = errors.find((error) => error);
  if (firstError) {
    throw new Error(firstError.message);
  }
}

export async function cancelLedgerRows(
  supabase: SupabaseClient,
  userId: string,
  origin: LedgerOrigin,
  entityIds: string[]
) {
  if (entityIds.length === 0) {
    return;
  }

  const errors = await Promise.all(
    entityIds.map(async (entityId) => {
      const { error } = await supabase.rpc("cancel_ledger", {
        p_entidade_id: entityId,
        p_entidade_origem: origin,
        p_user_id: userId
      });

      return error;
    })
  );

  const firstError = errors.find((error) => error);
  if (firstError) {
    throw new Error(firstError.message);
  }
}
