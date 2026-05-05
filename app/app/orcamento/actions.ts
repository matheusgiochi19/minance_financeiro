"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCurrency } from "@/lib/expenses";
import { requireAuthenticatedUser } from "@/lib/user-data";

export async function createOrcamento(formData: FormData) {
  const categoriaId = String(formData.get("categoria_id") || "");
  const percentual = Number(String(formData.get("percentual_renda") || "0").replace(",", "."));
  const valor = parseCurrency(formData.get("valor_limite"));

  if (!categoriaId || percentual < 0) return;

  const { supabase, user } = await requireAuthenticatedUser();
  await supabase.from("orcamentos").insert({
    categoria_id: categoriaId,
    percentual_renda: percentual,
    user_id: user.id,
    valor_limite: valor > 0 ? valor : null
  });
  revalidatePath("/app/orcamento");
  redirect("/app/orcamento");
}

export async function updateOrcamento(formData: FormData) {
  const id = String(formData.get("id") || "");
  const categoriaId = String(formData.get("categoria_id") || "");
  const percentual = Number(String(formData.get("percentual_renda") || "0").replace(",", "."));
  const valor = parseCurrency(formData.get("valor_limite"));

  if (!id || !categoriaId || percentual < 0) return;

  const { supabase, user } = await requireAuthenticatedUser();
  await supabase
    .from("orcamentos")
    .update({
      categoria_id: categoriaId,
      percentual_renda: percentual,
      valor_limite: valor > 0 ? valor : null
    })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/app/orcamento");
  redirect("/app/orcamento");
}

export async function deleteOrcamento(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { supabase, user } = await requireAuthenticatedUser();
  await supabase.from("orcamentos").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/orcamento");
}
