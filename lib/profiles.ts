import { createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "master";

export type Profile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  ativo: boolean;
  foto_path: string | null;
  juros_atraso: number | null;
  onboarding_hidden: boolean;
  tema: "light" | "dark";
  created_at: string;
  updated_at: string;
};

export async function resolveAvatarUrl(avatarPath: string | null | undefined) {
  if (!avatarPath) return null;

  if (avatarPath.startsWith("http")) {
    return avatarPath;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("profile-avatars").createSignedUrl(avatarPath, 60 * 60);

  console.log("[avatar-debug] signed-url", {
    error: error?.message || null,
    path: avatarPath,
    signedUrl: data?.signedUrl || null
  });
  console.info("[avatar-signed-url]", {
    hasSignedUrl: Boolean(data?.signedUrl),
    path: avatarPath,
    storageError: error?.message
  });

  return data?.signedUrl || null;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,user_id,email,full_name,avatar_url,role,ativo,foto_path,juros_atraso,onboarding_hidden,tema,created_at,updated_at")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();

  console.log("[avatar-debug] profile-lookup", {
    avatarUrl: profile?.avatar_url || null,
    profileId: profile?.id || null,
    profileUserId: profile?.user_id || null,
    userId: user.id
  });

  return { user, profile };
}

export function isMaster(profile: Pick<Profile, "role" | "ativo"> | null) {
  return profile?.role === "master" && profile.ativo;
}
