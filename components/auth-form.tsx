"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

type AuthFormProps = {
  action: (previousState: { message: string }, formData: FormData) => Promise<{ message: string }>;
  buttonLabel: string;
  footerHref: string;
  footerLabel: string;
  footerText: string;
  redirectTo?: string;
};

const initialState = {
  message: ""
};

export function AuthForm({
  action,
  buttonLabel,
  footerHref,
  footerLabel,
  footerText,
  redirectTo
}: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="auth-card">
      {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
      <label>
        <span>E-mail</span>
        <input autoComplete="email" name="email" placeholder="voce@email.com" required type="email" />
      </label>
      <label>
        <span>Senha</span>
        <input autoComplete="current-password" minLength={6} name="password" placeholder="********" required type="password" />
      </label>
      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? <Loader2 aria-hidden className="spin" size={18} /> : null}
        {buttonLabel}
      </button>
      {state.message ? <p className="form-message">{state.message}</p> : null}
      <p className="auth-footer">
        {footerText} <Link href={footerHref}>{footerLabel}</Link>
      </p>
    </form>
  );
}
