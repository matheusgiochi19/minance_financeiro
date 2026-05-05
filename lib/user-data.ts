import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NamedUserRecord = {
  id: string;
  nome: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type UserTableName = "categorias" | "bolsos";

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function listUserRecords(table: UserTableName) {
  const { supabase, user } = await requireAuthenticatedUser();

  return supabase
    .from(table)
    .select("id,nome,user_id,created_at,updated_at")
    .eq("user_id", user.id)
    .order("nome", { ascending: true })
    .returns<NamedUserRecord[]>();
}

export async function getUserRecord(table: UserTableName, id: string) {
  const { supabase, user } = await requireAuthenticatedUser();

  return supabase
    .from(table)
    .select("id,nome,user_id,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<NamedUserRecord>();
}

export function normalizeName(formData: FormData) {
  return String(formData.get("nome") || "").trim();
}
