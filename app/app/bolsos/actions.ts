"use server";

import { revalidatePath } from "next/cache";
import { normalizeName, requireAuthenticatedUser } from "@/lib/user-data";

export async function createBolso(formData: FormData) {
  const nome = normalizeName(formData);

  if (!nome) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await supabase.from("bolsos").insert({ nome, user_id: user.id });
  revalidatePath("/app/bolsos");
}

export async function updateBolso(formData: FormData) {
  const id = String(formData.get("id") || "");
  const nome = normalizeName(formData);

  if (!id || !nome) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await supabase.from("bolsos").update({ nome }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/bolsos");
}

export async function deleteBolso(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { supabase, user } = await requireAuthenticatedUser();
  await supabase.from("bolsos").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/bolsos");
}
