import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";

import { updatePasswordAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUsuarioAutenticadoComPerfil } from "@/lib/users";

type PrimeiroAcessoPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function PrimeiroAcessoPage({ searchParams }: PrimeiroAcessoPageProps) {
  const params = searchParams ? await searchParams : {};
  const errorMessage = readParam(params, "error");

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  const usuario = await getUsuarioAutenticadoComPerfil(supabase, session.user);

  if (!usuario?.senha_provisoria_ativa) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cor_fundo_primaria)] px-6 py-10 text-[var(--cor_texto_escuro)]">
      <section className="w-full max-w-xl rounded-[28px] bg-[var(--cor_fundo_secundaria)] p-8 shadow-[0_18px_40px_rgba(44,59,77,0.12)]">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--cor_escura_primaria)] p-3 text-[var(--cor_texto_claro)]">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-[var(--cor_escura_primaria)]/70">Primeiro acesso</p>
            <h1 className="text-2xl font-semibold">Defina sua nova senha</h1>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-[var(--cor_escura_primaria)]/80">
          Para continuar, troque a senha provisoria da conta. Esse passo e obrigatorio antes de acessar o dashboard.
        </p>

        {errorMessage && (
          <div className="mt-5 rounded-lg border border-[var(--cor_despesa_secundaria)] bg-[var(--cor_despesa_primaria)]/25 px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        <form action={updatePasswordAction} className="mt-6 grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Nova senha</span>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="h-12 w-full rounded-xl border border-[var(--cor_escura_primaria)]/14 bg-[var(--cor_fundo_primaria)] px-4 text-sm outline-none focus:border-[var(--cor_destaque_secundaria)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Confirmar nova senha</span>
            <input
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              className="h-12 w-full rounded-xl border border-[var(--cor_escura_primaria)]/14 bg-[var(--cor_fundo_primaria)] px-4 text-sm outline-none focus:border-[var(--cor_destaque_secundaria)]"
            />
          </label>

          <button
            type="submit"
            className="mt-3 inline-flex h-12 items-center justify-center rounded-xl bg-[var(--cor_fundo_botao)] px-4 text-sm font-semibold text-[var(--cor_texto_claro)]"
          >
            Salvar nova senha
          </button>
        </form>
      </section>
    </main>
  );
}
