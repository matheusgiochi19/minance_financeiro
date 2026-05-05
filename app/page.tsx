import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="product-mark">
            <Image alt="" height={34} priority src="/Minance_Icone.png" width={34} />
            <span>Minance</span>
          </div>
          <h1>Gestão Financeira Pessoal</h1>
          <p>
            Organize receitas, despesas, cartões e metas em uma experiência clara, segura e preparada para evoluir sprint a sprint.
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
      </section>
      <section className="landing-security">
        <ShieldCheck size={20} />
        <span>Autenticação via Supabase, verificação de e-mail obrigatória e área protegida.</span>
      </section>
    </main>
  );
}
