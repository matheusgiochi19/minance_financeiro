"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth";

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
  const tipo = String(formData.get("tipo") ?? "despesa");
  const status = String(formData.get("status") ?? "pendente");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const data = String(formData.get("data") ?? "");
  const categoriaId = String(formData.get("categoria_id") ?? "").trim();
  const bolsoId = String(formData.get("bolso_id") ?? "").trim();
  const cartaoId = String(formData.get("cartao_id") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  if (!descricao || !valor || !data) {
    return;
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return;
  }

  if (tipo === "receita") {
    await supabase.from("receitas").insert({
      user_id: user.id,
      descricao,
      valor,
      data_recebimento: data,
      categoria_id: categoriaId || null,
      bolso_id: bolsoId || null,
      observacoes: observacoes || null,
    });
  } else {
    const { data: despesa } = await supabase
      .from("despesas")
      .insert({
        user_id: user.id,
        status,
        descricao,
        valor,
        data_despesa: data,
        categoria_id: categoriaId || null,
        bolso_id: bolsoId || null,
        cartao_id: cartaoId || null,
        observacoes: observacoes || null,
      })
      .select("id")
      .single();

    if (cartaoId && despesa?.id) {
      const competencia = data.slice(0, 7);
      await supabase.from("despesas_cartao").insert({
        user_id: user.id,
        despesa_id: despesa.id,
        cartao_id: cartaoId,
        competencia,
        parcela_atual: 1,
        parcelas_totais: 1,
      });
    }
  }

  revalidatePath("/dashboard");
}

export async function deleteMovimentoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const tipo = String(formData.get("tipo") ?? "despesa");
  if (!id) {
    return;
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return;
  }

  if (tipo === "receita") {
    await supabase.from("receitas").delete().eq("id", id).eq("user_id", user.id);
  } else {
    await supabase.from("despesas_cartao").delete().eq("despesa_id", id).eq("user_id", user.id);
    await supabase.from("despesas").delete().eq("id", id).eq("user_id", user.id);
  }

  revalidatePath("/dashboard");
}

