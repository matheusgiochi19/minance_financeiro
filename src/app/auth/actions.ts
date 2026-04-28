"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUsuarioAplicacao } from "@/lib/users";

const TEMP_PASSWORD_COOKIE = "minance-temp-password";

function getRedirectUrl(type: "error" | "success", message: string) {
  const params = new URLSearchParams({ [type]: message });
  return `/auth?${params.toString()}`;
}

function generateTemporaryPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(getRedirectUrl("error", error.message));
  }

  const usuario = await getUsuarioAplicacao(supabase, data.user.id);

  revalidatePath("/", "layout");
  redirect(usuario?.senha_provisoria_ativa ? "/primeiro-acesso" : "/dashboard");
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const temporaryPassword = generateTemporaryPassword();

  const supabase = await createSupabaseServerClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password: temporaryPassword,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(getRedirectUrl("error", error.message));
  }

  const cookieStore = await cookies();
  cookieStore.set(TEMP_PASSWORD_COOKIE, temporaryPassword, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth",
    maxAge: 60 * 10,
  });

  if (!data.session) {
    redirect(
      getRedirectUrl(
        "success",
        "Conta criada. Se a confirmacao de e-mail estiver ativa no Supabase, confirme o e-mail e depois entre com a senha provisoria exibida abaixo.",
      ),
    );
  }

  revalidatePath("/", "layout");
  redirect("/primeiro-acesso");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/auth");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    redirect(getRedirectUrl("error", "A nova senha deve ter pelo menos 8 caracteres."));
  }

  if (password !== confirmPassword) {
    redirect(getRedirectUrl("error", "As senhas informadas nao conferem."));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getRedirectUrl("error", "Sessao invalida. Entre novamente."));
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(getRedirectUrl("error", error.message));
  }

  await supabase
    .from("users")
    .update({ senha_provisoria_ativa: false })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function readAndClearTemporaryPassword() {
  const cookieStore = await cookies();
  const value = cookieStore.get(TEMP_PASSWORD_COOKIE)?.value ?? null;

  if (value) {
    cookieStore.delete(TEMP_PASSWORD_COOKIE);
  }

  return value;
}
