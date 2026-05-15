"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  if (!fullName) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.auth.updateUser({ data: { full_name: fullName } });
  await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
  revalidatePath("/app", "layout");
  revalidatePath("/app/perfil");
}

export async function updateEmail(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.auth.updateUser({ email });
  await supabase.from("profiles").update({ email }).eq("user_id", user.id);
  revalidatePath("/app", "layout");
  revalidatePath("/app/perfil");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 6) return;
  const supabase = await createClient();
  await supabase.auth.updateUser({ password });
  revalidatePath("/app/perfil");
}
