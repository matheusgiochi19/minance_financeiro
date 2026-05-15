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
    console.log("[avatar-debug] formdata-entries");
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    const avatar = formData.get("avatar");
    console.log("[avatar-debug] raw-avatar", avatar);
    console.log("[avatar-debug] avatar-instanceof-file", avatar instanceof File);
    console.log("[avatar-debug] file-received", {
      exists: avatar instanceof File,
      name: avatar instanceof File ? avatar.name : null,
      size: avatar instanceof File ? avatar.size : null,
      type: avatar instanceof File ? avatar.type : null
    });

    if (!(avatar instanceof File) || avatar.size === 0) {
      return { message: "O backend nao recebeu um arquivo valido no campo avatar.", ok: false };
    }

    if (avatar.size > MAX_PHOTO_SIZE) {
      return { message: "A imagem deve ter no maximo 50MB.", ok: false };
    }

    const ext = allowedImageTypes.get(avatar.type);
    if (!ext) {
      return { message: "Formato invalido. Envie JPG, PNG ou WEBP.", ok: false };
    }

    const { supabase, user } = await requireUser();
    console.log("[avatar-debug] user", {
      email: user.email,
      id: user.id
    });
    const bucketCheck = await supabase.storage.getBucket(AVATAR_BUCKET);
    console.log("[avatar-bucket-check]", bucketCheck);

    if (bucketCheck.error) {
      return { message: `Bucket ${AVATAR_BUCKET} nao encontrado. Execute a migration da sprint.`, ok: false };
    }

    if (!bucketCheck.data || (bucketCheck.data.name !== AVATAR_BUCKET && bucketCheck.data.id !== AVATAR_BUCKET)) {
      return { message: `Bucket ${AVATAR_BUCKET} nao encontrado. Execute a migration da sprint.`, ok: false };
    }

    const buckets = await supabase.storage.listBuckets();
    console.log("[avatar-debug] buckets", buckets);

    if (buckets.error) {
      return { message: `Falha ao listar buckets: ${buckets.error.message}`, ok: false };
    }

    if (!buckets.data?.some((bucket) => bucket.name === AVATAR_BUCKET || bucket.id === AVATAR_BUCKET)) {
      return { message: `Bucket ${AVATAR_BUCKET} nao encontrado. Execute a migration da sprint.`, ok: false };
    }

    const safeOriginalName = sanitizeFileName(avatar.name);
    const storagePath = `${user.id}/avatar-${crypto.randomUUID()}-profile.${ext}`;
    console.log("[avatar-debug] generated-path", storagePath);

    console.info("[avatar-upload]", {
      contentType: avatar.type,
      fileName: safeOriginalName,
      size: avatar.size,
      storagePath,
      userId: user.id
    });

    const { data: currentProfile } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle<{ avatar_url: string | null }>();
    const previousPath = currentProfile?.avatar_url && !currentProfile.avatar_url.startsWith("http") ? currentProfile.avatar_url : null;

    const uploadResult = await supabase.storage.from(AVATAR_BUCKET).upload(storagePath, avatar, {
      cacheControl: "3600",
      contentType: avatar.type,
      upsert: false
    });
    console.log("[avatar-debug] upload-result", uploadResult);

    if (uploadResult.error) {
      return { message: `Upload falhou: ${uploadResult.error.message}`, ok: false };
    }
    console.log("[avatar-upload-success]", {
      path: storagePath,
      userId: user.id
    });

    const { data: objectCheck, error: objectCheckError } = await supabase.storage.from(AVATAR_BUCKET).list(user.id);
    console.log("[avatar-debug] storage-check", objectCheck);

    if (objectCheckError) {
      return { message: `Falha ao validar o Storage: ${objectCheckError.message}`, ok: false };
    }

    if (!objectCheck?.some((item) => `${user.id}/${item.name}` === storagePath)) {
      return { message: "Upload concluido, mas o objeto nao foi encontrado no Storage.", ok: false };
    }

    console.log("[avatar-debug] saving-profile", {
      storagePath,
      userId: user.id
    });

    const { error: profileError } = await supabase.rpc("save_my_avatar_path", {
      p_avatar_path: storagePath
    });

    if (profileError) {
      await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
      return { message: `Imagem enviada, mas nao foi possivel salvar no perfil: ${profileError.message}`, ok: false };
    }

    await supabase.auth.updateUser({ data: { avatar_url: storagePath } });

    const profileByUserIdResult = await supabase
      .from("profiles")
      .select("id,user_id,avatar_url")
      .eq("user_id", user.id)
      .maybeSingle<{ avatar_url: string | null; id: string; user_id: string }>();
    const profileByIdResult = await supabase
      .from("profiles")
      .select("id,user_id,avatar_url")
      .eq("id", user.id)
      .maybeSingle<{ avatar_url: string | null; id: string; user_id: string }>();

    console.log("[avatar-debug] profile-after-save", {
      byId: profileByIdResult.data,
      byUserId: profileByUserIdResult.data,
      userId: user.id
    });

    const savedProfile = profileByUserIdResult.data;
    const readError = profileByUserIdResult.error;

    console.info("[avatar-db-save]", {
      avatarPersisted: savedProfile?.avatar_url === storagePath,
      storagePath,
      userId: user.id
    });
    console.log("[avatar-db-persist]", {
      byId: profileByIdResult.data?.avatar_url || null,
      byUserId: profileByUserIdResult.data?.avatar_url || null,
      storagePath
    });

    if (readError || savedProfile?.avatar_url !== storagePath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
      return { message: readError?.message || "Imagem enviada, mas o banco nao confirmou o path do avatar.", ok: false };
    }

    const signedUrlData = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(storagePath, 60 * 60);
    console.log("[avatar-debug] signed-url", signedUrlData);

    if (signedUrlData.error || !signedUrlData.data?.signedUrl) {
      await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
      return { message: signedUrlData.error?.message || "O avatar foi salvo, mas a signed URL falhou na validacao.", ok: false };
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
