"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";

type AuthFormProps = {
  action: (previousState: { message: string; type?: "error" | "success" }, formData: FormData) => Promise<{ message: string; type?: "error" | "success" }>;
  buttonLabel: string;
  footerHref: string;
  footerLabel: string;
  footerText: string;
  includeFullName?: boolean;
  redirectTo?: string;
};

const initialState = {
  message: "",
  type: "error" as const
};

export function AuthForm({
  action,
  buttonLabel,
  footerHref,
  footerLabel,
  footerText,
  includeFullName = false,
  redirectTo
}: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="auth-card">
      {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
      {includeFullName ? (
        <label>
          <span>Nome completo</span>
          <input autoComplete="name" maxLength={120} name="full_name" placeholder="Seu nome completo" required />
        </label>
      ) : null}
      <label>
        <span>E-mail</span>
        <input autoComplete="email" maxLength={160} name="email" placeholder="seu@email.com" required type="email" />
      </label>
      <label>
        <span>Senha</span>
        <input autoComplete="current-password" minLength={6} name="password" placeholder="********" required type="password" />
      </label>
      {includeFullName ? (
        <label className="privacy-consent">
          <input name="privacy_accepted" required type="checkbox" value="yes" />
          <span>Li e aceito a Política de Privacidade</span>
        </label>
      ) : null}
      <Button disabled={isPending} type="submit">
        {isPending ? <Loader2 aria-hidden className="spin" size={18} /> : null}
        {buttonLabel}
      </Button>
      {state.message ? <AlertBanner key={`${state.type || "error"}-${state.message}`} message={state.message} type={state.type || "error"} /> : null}
      <p className="auth-footer">
        {footerText} <Link href={footerHref}>{footerLabel}</Link>
      </p>
    </form>
  );
}
