import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
import { UrlAlertBanner } from "@/components/url-alert-banner";
import { signIn } from "@/app/auth-actions";
import { APP_VERSION } from "@/config/app-version";

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
        <p className="auth-subtitle">Use seu e-mail confirmado para acessar a area protegida.</p>
        <UrlAlertBanner />
        <AuthForm
          action={signIn}
          buttonLabel="Entrar"
          footerHref="/cadastro"
          footerLabel="Criar conta"
          footerText="Ainda nao tem conta?"
          redirectTo={params.redirectTo}
        />
        <p className="auth-version">{APP_VERSION}</p>
      </section>
    </main>
  );
}
