"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCurrency } from "@/lib/expenses";
import { setFlashMessage } from "@/lib/flash";
import { requireAuthenticatedUser } from "@/lib/user-data";

export async function createOrcamento(formData: FormData) {
  const categoriaId = String(formData.get("categoria_id") || "");
  const percentual = Number(String(formData.get("percentual_renda") || "0").replace(",", "."));
  const valor = parseCurrency(formData.get("valor_limite"));

  if (!categoriaId || percentual < 0) {
    await setFlashMessage("error", "Preencha os dados obrigatorios do orcamento.");
    redirect("/app/orcamento/novo");
  }

  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("create_orcamento", {
    p_categoria_id: categoriaId,
    p_percentual_renda: percentual,
    p_valor_limite: valor > 0 ? valor : null
  });
  if (error) {
    await setFlashMessage("error", error.message);
    redirect("/app/orcamento/novo");
  }
  await setFlashMessage("success", "Orcamento salvo com sucesso.");
  revalidatePath("/app/orcamento");
  redirect("/app/orcamento");
}

export async function updateOrcamento(formData: FormData) {
  const id = String(formData.get("id") || "");
  const categoriaId = String(formData.get("categoria_id") || "");
  const percentual = Number(String(formData.get("percentual_renda") || "0").replace(",", "."));
  const valor = parseCurrency(formData.get("valor_limite"));

  if (!id || !categoriaId || percentual < 0) {
    await setFlashMessage("error", "Nao foi possivel salvar o orcamento.");
    redirect(id ? `/app/orcamento/${id}/editar` : "/app/orcamento");
  }

  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("update_orcamento", {
    p_categoria_id: categoriaId,
    p_id: id,
    p_percentual_renda: percentual,
    p_valor_limite: valor > 0 ? valor : null
  });
  if (error) {
    await setFlashMessage("error", error.message);
    redirect(`/app/orcamento/${id}/editar`);
  }
  await setFlashMessage("success", "Orcamento atualizado com sucesso.");
  revalidatePath("/app/orcamento");
  redirect("/app/orcamento");
}

export async function deleteOrcamento(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("delete_orcamento", { p_id: id });
  if (error) {
    await setFlashMessage("error", error.message);
    revalidatePath("/app/orcamento");
    return;
  }
  await setFlashMessage("success", "Orcamento excluido com sucesso.");
  revalidatePath("/app/orcamento");
}
