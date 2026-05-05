"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeName, requireAuthenticatedUser } from "@/lib/user-data";

export async function createCategoria(formData: FormData) {
  const nome = normalizeName(formData);

  if (!nome) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await supabase.from("categorias").insert({ nome, user_id: user.id });
  revalidatePath("/app/categorias");
  redirect("/app/categorias");
}

export async function updateCategoria(formData: FormData) {
  const id = String(formData.get("id") || "");
  const nome = normalizeName(formData);

  if (!id || !nome) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await supabase.from("categorias").update({ nome }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/categorias");
  redirect("/app/categorias");
}

export async function deleteCategoria(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await supabase.from("categorias").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/categorias");
}
