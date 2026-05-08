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

  return { user, profile };
}

export function isMaster(profile: Pick<Profile, "role" | "ativo"> | null) {
  return profile?.role === "master" && profile.ativo;
}
