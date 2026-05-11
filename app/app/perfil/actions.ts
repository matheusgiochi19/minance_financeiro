"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";

const MAX_PHOTO_SIZE = 50 * 1024 * 1024;

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

export async function uploadProfilePhoto(formData: FormData) {
  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_PHOTO_SIZE || !file.type.startsWith("image/")) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type,
    upsert: true
  });
  if (error) return;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = data.publicUrl || `${getSupabaseConfig().supabaseUrl}/storage/v1/object/public/avatars/${path}`;
  await supabase.from("profiles").update({ avatar_url: avatarUrl, foto_path: path }).eq("user_id", user.id);
  revalidatePath("/app", "layout");
  revalidatePath("/app/perfil");
}
