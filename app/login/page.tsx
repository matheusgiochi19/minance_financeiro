import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/app/auth-actions";

type LoginPageProps = {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <Link className="auth-logo" href="/">
        <Image alt="" height={38} priority src="/Minance_Icone.png" width={38} />
        Minance
      </Link>
      <section>
        <p className="eyebrow">Acesso seguro</p>
        <h1>Entrar</h1>
        <p className="auth-subtitle">Use seu e-mail confirmado para acessar a área protegida.</p>
        <AuthForm
          action={signIn}
          buttonLabel="Entrar"
          footerHref="/cadastro"
          footerLabel="Criar conta"
          footerText="Ainda não tem conta?"
          redirectTo={params.redirectTo}
        />
      </section>
    </main>
  );
}
