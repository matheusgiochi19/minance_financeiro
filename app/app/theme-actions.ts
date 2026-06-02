"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeThemePreference } from "@/lib/theme";

export async function saveThemePreference(value: unknown) {
  const theme = normalizeThemePreference(value);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessao expirada. Entre novamente.", ok: false, theme } as const;
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({ theme_preference: theme })
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .select("theme_preference")
    .maybeSingle();

  if (error || !updatedProfile) {
    return { error: error?.message || "Perfil nao encontrado.", ok: false, theme } as const;
  }

  if (normalizeThemePreference(updatedProfile.theme_preference) !== theme) {
    return { error: "Tema nao foi persistido no perfil.", ok: false, theme } as const;
  }

  revalidatePath("/app", "layout");
  revalidatePath("/app/perfil");
  revalidatePath("/app/configuracoes");

  return { error: null, ok: true, theme } as const;
}
