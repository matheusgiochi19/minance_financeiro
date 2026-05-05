"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCurrency } from "@/lib/expenses";
import { requireAuthenticatedUser } from "@/lib/user-data";

function optionalUuid(value: FormDataEntryValue | null) {
  const parsed = String(value || "");
  return parsed ? parsed : null;
}

export async function createReceita(formData: FormData) {
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));

  if (!descricao || valor <= 0) return;

  const { supabase } = await requireAuthenticatedUser();
  await supabase.rpc("create_receita", {
    p_bolso_id: optionalUuid(formData.get("bolso_id")),
    p_categoria_id: optionalUuid(formData.get("categoria_id")),
    p_descricao: descricao,
    p_valor: valor
  });
  revalidatePath("/app/receitas");
  redirect("/app/receitas");
}

export async function updateReceita(formData: FormData) {
  const id = String(formData.get("id") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = parseCurrency(formData.get("valor"));

  if (!id || !descricao || valor <= 0) return;

  const { supabase } = await requireAuthenticatedUser();
  await supabase.rpc("update_receita", {
    p_bolso_id: optionalUuid(formData.get("bolso_id")),
    p_categoria_id: optionalUuid(formData.get("categoria_id")),
    p_descricao: descricao,
    p_id: id,
    p_valor: valor
  });
  revalidatePath("/app/receitas");
  redirect("/app/receitas");
}

export async function deleteReceita(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { supabase } = await requireAuthenticatedUser();
  await supabase.rpc("delete_receita", { p_id: id });
  revalidatePath("/app/receitas");
}
