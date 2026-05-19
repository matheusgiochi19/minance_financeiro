"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { hideOnboarding } from "@/app/app/onboarding-actions";

const ONBOARDING_SESSION_KEY = "minance-onboarding-seen-session";

export function OnboardingPanel() {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(ONBOARDING_SESSION_KEY) === "true";
  });

  useEffect(() => {
    if (hidden) return;
    window.sessionStorage.setItem(ONBOARDING_SESSION_KEY, "true");
    const timer = window.setTimeout(() => setHidden(true), 10000);
    return () => window.clearTimeout(timer);
  }, [hidden]);

  if (hidden) return null;

  return (
    <section className="onboarding-panel">
      <div>
        <p>Primeiros passos</p>
        <h2>Configure sua base financeira</h2>
      </div>
      <div className="onboarding-steps">
        <Link href="/app/categorias/nova"><CheckCircle2 size={18} />Criar categoria</Link>
        <Link href="/app/bolsos/novo"><CheckCircle2 size={18} />Criar bolso</Link>
        <Link href="/app/cartoes/novo"><CheckCircle2 size={18} />Criar cartão</Link>
      </div>
      <form
        action={async () => {
          setHidden(true);
          await hideOnboarding();
        }}
      >
        <button aria-label="Não mostrar novamente" type="submit"><X size={18} />Não mostrar novamente</button>
      </form>
    </section>
  );
}
