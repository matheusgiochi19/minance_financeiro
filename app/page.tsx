import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

type LandingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const params = searchParams ? await searchParams : {};
  const callbackKeys = ["code", "error", "error_code", "error_description", "token_hash", "type"];
  const hasAuthCallback = callbackKeys.some((key) => typeof params[key] !== "undefined");

  if (hasAuthCallback) {
    const query = new URLSearchParams();
    callbackKeys.forEach((key) => {
      const value = params[key];
      if (typeof value === "string" && value) {
        query.set(key, value);
      }
    });

    const authConfirmHref = `/auth/confirm${query.toString() ? `?${query.toString()}` : ""}`;
    redirect(authConfirmHref as never);
  }

  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="product-mark">
            <Image alt="" height={34} priority src="/Minance_Icone.png" width={34} />
            <span>Minance</span>
          </div>
          <h1>Gestao Financeira Pessoal</h1>
          <p>Organize receitas, despesas, cartoes e metas em uma experiencia clara, segura e simples de acompanhar.</p>
          <div className="landing-actions">
            <Link className="primary-button" href="/cadastro">
              Criar conta
              <ArrowRight size={18} />
            </Link>
            <Link className="secondary-button" href="/login">
              Entrar
            </Link>
          </div>
        </div>
      </section>
      <section className="landing-security">
        <ShieldCheck size={20} />
        <span>Conta protegida, confirmacao de e-mail e dados financeiros privados.</span>
      </section>
    </main>
  );
}
