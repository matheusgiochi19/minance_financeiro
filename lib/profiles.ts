import { createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "master";

export type ThemePreference = "light" | "dark";

export type Profile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  ativo: boolean;
  juros_atraso: number | null;
  onboarding_hidden: boolean;
  theme_preference: ThemePreference | null;
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
    .select("id,user_id,email,full_name,role,ativo,juros_atraso,onboarding_hidden,theme_preference,created_at,updated_at")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle<Profile>();

  return { user, profile };
}

export function isMaster(profile: Pick<Profile, "role" | "ativo"> | null) {
  return profile?.role === "master" && profile.ativo;
}
