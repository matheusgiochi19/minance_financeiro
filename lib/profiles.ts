import { createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "master";

export type Profile = {
  id: string;
  user_id: string;
  email: string;
  role: AppRole;
  ativo: boolean;
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
    .select("id,user_id,email,role,ativo,created_at,updated_at")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();

  return { user, profile };
}

export function isMaster(profile: Pick<Profile, "role" | "ativo"> | null) {
  return profile?.role === "master" && profile.ativo;
}
