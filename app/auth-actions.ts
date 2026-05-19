"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import { withUiAlert } from "@/lib/ui-alert";

type AuthState = {
  message: string;
  type?: "error" | "success";
};

export async function signUp(_previousState: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!fullName || !email || !password) {
    return { message: "Informe nome completo, e-mail e senha.", type: "error" };
  }

  if (password.length < 6) {
    return { message: "A senha deve ter pelo menos 6 caracteres.", type: "error" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: `${getSiteUrl()}/app/dashboard`
    }
  });

  if (error) {
    return { message: error.message, type: "error" };
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      email,
      full_name: fullName,
      user_id: data.user.id
    }, { onConflict: "user_id" });
  }

  return { message: "Cadastro criado. Confirme seu e-mail antes de acessar o Minance.", type: "success" };
}

export async function signIn(_previousState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirectTo") || "/app/dashboard");

  if (!email || !password) {
    return { message: "Informe e-mail e senha.", type: "error" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { message: error.message, type: "error" };
  }

  if (!data.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    return { message: "Confirme seu e-mail antes de fazer login.", type: "error" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ativo")
    .eq("user_id", data.user.id)
    .maybeSingle<{ ativo: boolean }>();

  if (profile?.ativo === false) {
    await supabase.auth.signOut();
    return { message: "Seu usuario esta bloqueado. Fale com o administrador.", type: "error" };
  }

  redirect(withUiAlert(redirectTo.startsWith("/app") ? redirectTo : "/app/dashboard", "success", "Login realizado com sucesso."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(withUiAlert("/login", "success", "Logout realizado com sucesso."));
}
