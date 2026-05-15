"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = "profile-avatars";
const MAX_PHOTO_SIZE = 50 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export type AvatarUploadState = {
  message: string;
  ok: boolean;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  return { supabase, user };
}

function sanitizeFileName(fileName: string) {
  return fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export async function uploadProfilePhoto(_previousState: AvatarUploadState, formData: FormData): Promise<AvatarUploadState> {
  try {
    const file = formData.get("foto");
    if (!(file instanceof File) || file.size === 0) {
      return { message: "Selecione uma imagem para enviar.", ok: false };
    }

    if (file.size > MAX_PHOTO_SIZE) {
      return { message: "A imagem deve ter no maximo 50MB.", ok: false };
    }

    const ext = allowedImageTypes.get(file.type);
    if (!ext) {
      return { message: "Formato invalido. Envie JPG, PNG ou WEBP.", ok: false };
    }

    const { supabase, user } = await requireUser();
    const safeOriginalName = sanitizeFileName(file.name);
    const storagePath = `${user.id}/avatar-${crypto.randomUUID()}-profile.${ext}`;

    console.info("[avatar-upload]", {
      contentType: file.type,
      fileName: safeOriginalName,
      size: file.size,
      storagePath,
      userId: user.id
    });

    const { data: currentProfile } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle<{ avatar_url: string | null }>();
    const previousPath = currentProfile?.avatar_url && !currentProfile.avatar_url.startsWith("http") ? currentProfile.avatar_url : null;

    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });

    if (uploadError) {
      return { message: `Upload falhou: ${uploadError.message}`, ok: false };
    }

    const { error: profileError } = await supabase.rpc("save_my_avatar_path", {
      p_avatar_path: storagePath
    });

    if (profileError) {
      await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
      return { message: `Imagem enviada, mas nao foi possivel salvar no perfil: ${profileError.message}`, ok: false };
    }

    await supabase.auth.updateUser({ data: { avatar_url: storagePath } });

    const { data: savedProfile, error: readError } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle<{ avatar_url: string | null }>();

    console.info("[avatar-db-save]", {
      avatarPersisted: savedProfile?.avatar_url === storagePath,
      storagePath,
      userId: user.id
    });

    if (readError || savedProfile?.avatar_url !== storagePath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
      return { message: readError?.message || "Imagem enviada, mas o banco nao confirmou o path do avatar.", ok: false };
    }

    if (previousPath && previousPath !== storagePath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
    }

    revalidatePath("/app", "layout");
    revalidatePath("/app/perfil");
    return { message: "Foto atualizada com sucesso.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Nao foi possivel atualizar a foto.", ok: false };
  }
}
