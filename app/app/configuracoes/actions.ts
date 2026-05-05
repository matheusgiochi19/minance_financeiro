"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateConfiguracoes(formData: FormData) {
  const juros = Number(String(formData.get("juros_atraso") || "0").replace(",", "."));
  const tema = String(formData.get("tema") || "light") === "dark" ? "dark" : "light";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ juros_atraso: juros >= 0 ? juros : 0, tema }).eq("user_id", user.id);
  revalidatePath("/app/configuracoes");
}
