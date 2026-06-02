"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCurrency } from "@/lib/expenses";
import { withUiAlert } from "@/lib/ui-alert";
import { requireAuthenticatedUser } from "@/lib/user-data";

export async function createOrcamento(formData: FormData) {
  const categoriaId = String(formData.get("categoria_id") || "");
  const percentual = Number(String(formData.get("percentual_renda") || "0").replace(",", "."));
  const valor = parseCurrency(formData.get("valor_limite"));

  if (!categoriaId || percentual < 0) return;

  const { supabase } = await requireAuthenticatedUser();
  await supabase.rpc("create_orcamento", {
    p_categoria_id: categoriaId,
    p_percentual_renda: percentual,
    p_valor_limite: valor > 0 ? valor : null
  });
  revalidatePath("/app/orcamento");
  redirect(withUiAlert("/app/orcamento", "success", "Orcamento salvo com sucesso."));
}

export async function updateOrcamento(formData: FormData) {
  const id = String(formData.get("id") || "");
  const categoriaId = String(formData.get("categoria_id") || "");
  const percentual = Number(String(formData.get("percentual_renda") || "0").replace(",", "."));
  const valor = parseCurrency(formData.get("valor_limite"));

  if (!id || !categoriaId || percentual < 0) return;

  const { supabase } = await requireAuthenticatedUser();
  await supabase.rpc("update_orcamento", {
    p_categoria_id: categoriaId,
    p_id: id,
    p_percentual_renda: percentual,
    p_valor_limite: valor > 0 ? valor : null
  });
  revalidatePath("/app/orcamento");
  redirect(withUiAlert("/app/orcamento", "success", "Orcamento atualizado com sucesso."));
}

export async function deleteOrcamento(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { supabase } = await requireAuthenticatedUser();
  await supabase.rpc("delete_orcamento", { p_id: id });
  revalidatePath("/app/orcamento");
  redirect(withUiAlert("/app/orcamento", "success", "Orcamento excluido com sucesso."));
}
