"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";

type ConfirmState = {
  kind: "loading" | "success" | "error";
  message: string;
  title: string;
};

type AuthConfirmFlowProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function createAuthClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true
    }
  });
}

type AuthClient = ReturnType<typeof createAuthClient>;

function getErrorState(message?: string | null): ConfirmState {
  return {
    kind: "error",
    message: message || "O link pode ter expirado ou já ter sido utilizado.",
    title: "Não foi possível confirmar sua conta"
  };
}

function getSuccessState(): ConfirmState {
  return {
    kind: "success",
    message: "Seu cadastro foi ativado.\n\nAgora você já pode acessar sua conta normalmente.",
    title: "Conta confirmada com sucesso"
  };
}

function getSearchParamValue(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : "";
}

async function hasConfirmedIdentity(supabase: AuthClient) {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user;

  if (sessionUser?.email_confirmed_at) {
    return true;
  }

  const { data: userData } = await supabase.auth.getUser();
  return Boolean(userData.user?.email_confirmed_at);
}

export function AuthConfirmFlow({ searchParams }: AuthConfirmFlowProps) {
  const code = getSearchParamValue(searchParams, "code");
  const error = getSearchParamValue(searchParams, "error");
  const errorDescription = getSearchParamValue(searchParams, "error_description");
  const [state, setState] = useState<ConfirmState>({
    kind: "loading",
    message: "Confirmando sua conta...",
    title: "Validando seu acesso"
  });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const supabase = createAuthClient();
    let cancelled = false;

    async function confirmAccount() {
      try {
        if (await hasConfirmedIdentity(supabase)) {
          if (!cancelled) {
            setState(getSuccessState());
          }
          return;
        }

        let verificationErrorMessage = errorDescription || error || undefined;

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            verificationErrorMessage = exchangeError.message;
          }
        }

        if (await hasConfirmedIdentity(supabase)) {
          if (!cancelled) {
            setState(getSuccessState());
          }
          return;
        }

        if (!cancelled) {
          setState(getErrorState(verificationErrorMessage));
        }
      } catch (caughtError) {
        if (await hasConfirmedIdentity(supabase)) {
          if (!cancelled) {
            setState(getSuccessState());
          }
          return;
        }

        if (!cancelled) {
          const message = caughtError instanceof Error ? caughtError.message : errorDescription || error || undefined;
          setState(getErrorState(message));
        }
      }
    }

    void confirmAccount();

    return () => {
      cancelled = true;
    };
  }, [code, error, errorDescription]);

  return (
    <div className="auth-card auth-confirm-card" aria-live="polite">
      <div className={`auth-confirm-state auth-confirm-${state.kind}`}>
        <div className={`auth-confirm-icon auth-confirm-icon-${state.kind}`}>
          {state.kind === "loading" ? <Loader2 aria-hidden className="spin" size={28} /> : null}
          {state.kind === "success" ? <CheckCircle2 aria-hidden size={28} /> : null}
          {state.kind === "error" ? <TriangleAlert aria-hidden size={28} /> : null}
        </div>
        <div>
          <h2>{state.title}</h2>
          <p className="auth-confirm-message">{state.message}</p>
        </div>
        <div className="auth-confirm-actions">
          {state.kind === "success" ? (
            <Link className="primary-button" href="/login">
              Ir para Login
            </Link>
          ) : state.kind === "error" ? (
            <Link className="primary-button" href="/login">
              Voltar para Login
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
