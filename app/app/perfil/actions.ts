"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_PHOTO_SIZE = 50 * 1024 * 1024;
const allowedImageTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

export type AvatarUploadState = {
  avatarUrl?: string;
  message: string;
  ok: boolean;
};

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

export async function uploadProfilePhoto(_previousState: AvatarUploadState, formData: FormData): Promise<AvatarUploadState> {
  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Selecione uma imagem para enviar.", ok: false };
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return { message: "A imagem deve ter no máximo 50MB.", ok: false };
  }

  if (!allowedImageTypes.has(file.type)) {
    return { message: "Formato inválido. Envie JPG, PNG, WEBP ou GIF.", ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { message: "Sessão expirada. Faça login novamente.", ok: false };
  }

  const path = `${user.id}/avatar-${Date.now()}.png`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type,
    upsert: true
  });

  if (error) {
    return { message: `Upload falhou: ${error.message}`, ok: false };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
  const { error: profileError } = await supabase.from("profiles").update({ avatar_url: avatarUrl, foto_path: path }).eq("user_id", user.id);

  if (profileError) {
    return { message: `Imagem enviada, mas não foi possível salvar no perfil: ${profileError.message}`, ok: false };
  }

  revalidatePath("/app", "layout");
  revalidatePath("/app/perfil");
  return { avatarUrl, message: "Foto atualizada com sucesso.", ok: true };
}
