import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/app/auth-actions";

export default function CadastroPage() {
  return (
    <main className="auth-page">
      <Link className="auth-logo" href="/">
        Minance
      </Link>
      <section>
        <p className="eyebrow">Primeiro acesso</p>
        <h1>Cadastro</h1>
        <p className="auth-subtitle">Crie sua conta e confirme o e-mail enviado pelo Supabase.</p>
        <AuthForm
          action={signUp}
          buttonLabel="Cadastrar"
          footerHref="/login"
          footerLabel="Entrar"
          footerText="Ja tem conta?"
        />
      </section>
    </main>
  );
}
