"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";

type AuthState = {
  message: string;
};

export async function signUp(_previousState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { message: "Informe e-mail e senha." };
  }

  if (password.length < 6) {
    return { message: "A senha deve ter pelo menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/app/dashboard`
    }
  });

  if (error) {
    return { message: error.message };
  }

  return { message: "Cadastro criado. Confirme seu e-mail antes de acessar o Minance." };
}

export async function signIn(_previousState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirectTo") || "/app/dashboard");

  if (!email || !password) {
    return { message: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { message: error.message };
  }

  if (!data.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    return { message: "Confirme seu e-mail antes de fazer login." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ativo")
    .eq("user_id", data.user.id)
    .maybeSingle<{ ativo: boolean }>();

  if (profile?.ativo === false) {
    await supabase.auth.signOut();
    return { message: "Seu usuario esta bloqueado. Fale com o administrador." };
  }

  redirect(redirectTo.startsWith("/app") ? redirectTo : "/app/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
