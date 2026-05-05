"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_PHOTO_SIZE = 50 * 1024 * 1024;

export async function updateEmail(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return;
  const supabase = await createClient();
  await supabase.auth.updateUser({ email });
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
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_PHOTO_SIZE) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("perfil-fotos").upload(path, file, { upsert: false });
  if (error) return;
  await supabase.from("profiles").update({ foto_path: path }).eq("user_id", user.id);
  revalidatePath("/app/perfil");
}
