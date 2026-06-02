import Image from "next/image";
import Link from "next/link";
import { AuthConfirmFlow } from "@/components/auth-confirm-flow";

type AuthConfirmPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthConfirmPage({ searchParams }: AuthConfirmPageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <main className="auth-page auth-confirm-page">
      <Link className="auth-logo" href="/">
        <Image alt="" height={38} priority src="/Minance_Icone.png" width={38} />
        Minance
      </Link>
      <section>
        <p className="eyebrow">Confirmação de conta</p>
        <h1>Validando seu acesso</h1>
        <p className="auth-subtitle">Aguarde enquanto o Minance confirma sua conta e libera o acesso.</p>
        <AuthConfirmFlow searchParams={params} />
      </section>
    </main>
  );
}
