import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="product-mark">
            <Wallet size={22} />
            <span>Minance</span>
          </div>
          <h1>Gestao Financeira Pessoal</h1>
          <p>
            Organize receitas, despesas, cartoes e metas em uma experiencia clara, segura e preparada para evoluir sprint a sprint.
          </p>
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
        <div className="landing-preview" aria-label="Previa do dashboard Minance">
          <div className="preview-top" />
          <div className="preview-side" />
          <div className="preview-body">
            <span>Bem-vindo</span>
            <strong>Matheus Souchie</strong>
            <div className="preview-cards">
              <b>R$ 345,00</b>
              <b>R$ 4.200,00</b>
              <b>R$ 3.855,00</b>
            </div>
            <div className="preview-chart">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </section>
      <section className="landing-security">
        <ShieldCheck size={20} />
        <span>Autenticacao via Supabase, verificacao de e-mail obrigatoria e area protegida.</span>
      </section>
    </main>
  );
}
