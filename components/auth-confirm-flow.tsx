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

function getErrorState(message?: string | null): ConfirmState {
  return {
    kind: "error",
    message: message || "O link pode ter expirado ou já ter sido utilizado.",
    title: "Não foi possível confirmar sua conta"
  };
}

function getSearchParamValue(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : "";
}

export function AuthConfirmFlow({ searchParams }: AuthConfirmFlowProps) {
  const code = getSearchParamValue(searchParams, "code");
  const error = getSearchParamValue(searchParams, "error");
  const errorDescription = getSearchParamValue(searchParams, "error_description");
  const [state, setState] = useState<ConfirmState>(() => {
    if (error) {
      return getErrorState(errorDescription);
    }

    if (!code) {
      return getErrorState();
    }

    return {
      kind: "loading",
      message: "Confirmando sua conta...",
      title: "Validando seu acesso"
    };
  });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    if (error) {
      return;
    }

    if (!code) {
      return;
    }

    const supabase = createAuthClient();
    let cancelled = false;

    async function confirmAccount() {
      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          throw exchangeError;
        }

        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          throw new Error("Nao foi possivel validar sua conta.");
        }

        if (!cancelled) {
          setState({
            kind: "success",
            message: "Seu cadastro foi ativado.\n\nAgora você já pode acessar sua conta normalmente.",
            title: "Conta confirmada com sucesso"
          });
        }
      } catch {
        if (!cancelled) {
          setState(getErrorState());
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
