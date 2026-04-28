import { ShieldCheck, Wallet } from "lucide-react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUsuarioAutenticadoComPerfil } from "@/lib/users";

import {
  readAndClearTemporaryPassword,
  signInAction,
  signUpAction,
} from "./actions";

type AuthPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = searchParams ? await searchParams : {};
  const errorMessage = readParam(params, "error");
  const successMessage = readParam(params, "success");
  const temporaryPassword = await readAndClearTemporaryPassword();

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const usuario = await getUsuarioAutenticadoComPerfil(supabase, session.user);
    redirect(usuario?.senha_provisoria_ativa ? "/primeiro-acesso" : "/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--cor_fundo_primaria)] text-[var(--cor_texto_escuro)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="flex flex-col justify-between rounded-lg bg-[var(--cor_escura_primaria)] p-8 text-[var(--cor_texto_claro)] lg:p-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 text-sm font-medium text-[var(--cor_texto_claro)]">
              <span className="rounded-md bg-[var(--cor_destaque_primaria)]/20 p-2 text-[var(--cor_destaque_primaria)]">
                <Wallet className="size-4" />
              </span>
              Minance
            </div>

            <div className="max-w-2xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Gestao financeira pessoal com estrutura segura e foco real no dia a dia.
              </h1>
              <p className="max-w-xl text-base leading-7 text-[var(--cor_fundo_primaria)]/82 sm:text-lg">
                Tudo nasce no servidor, isolado por usuario e pronto para evoluir sprint a sprint.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-[var(--cor_escura_secundaria)] p-5">
            <div className="flex items-center gap-3 text-[var(--cor_destaque_primaria)]">
              <ShieldCheck className="size-5" />
              <p className="text-sm font-medium">Base alinhada com Supabase Auth e JWT</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--cor_fundo_primaria)]/80">
              Nenhuma query sensivel vai para o client e todo acesso passa por sessao autenticada.
            </p>
          </div>
        </section>

        <section className="grid content-center gap-6">
          {(errorMessage || successMessage || temporaryPassword) && (
            <div className="grid gap-3">
              {(errorMessage || successMessage) && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    errorMessage
                      ? "border-[var(--cor_despesa_secundaria)] bg-[var(--cor_despesa_primaria)]/25"
                      : "border-[var(--cor_destaque_secundaria)] bg-[var(--cor_destaque_primaria)]/20"
                  }`}
                >
                  {errorMessage ?? successMessage}
                </div>
              )}

              {temporaryPassword && (
                <div className="rounded-lg border border-[var(--cor_escura_primaria)]/10 bg-white/55 px-4 py-4">
                  <p className="text-sm font-medium text-[var(--cor_escura_primaria)]">
                    Senha provisoria gerada para teste
                  </p>
                  <p className="mt-2 rounded-md bg-[var(--cor_fundo_primaria)] px-3 py-2 font-mono text-sm">
                    {temporaryPassword}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[var(--cor_escura_primaria)]/72">
                    Este fluxo substitui temporariamente o envio por e-mail. Assim que integrarmos
                    service role e um provedor de e-mail, essa senha pode deixar de ser exibida na tela.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <form action={signInAction} className="rounded-lg bg-[var(--cor_fundo_secundaria)] p-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Entrar</h2>
                <p className="text-sm text-[var(--cor_escura_primaria)]/80">
                  Acesse seu painel financeiro.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm">E-mail</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="h-11 w-full rounded-md border border-[var(--cor_escura_primaria)]/15 bg-[var(--cor_fundo_primaria)] px-3 text-sm outline-none focus:border-[var(--cor_destaque_secundaria)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm">Senha</span>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="h-11 w-full rounded-md border border-[var(--cor_escura_primaria)]/15 bg-[var(--cor_fundo_primaria)] px-3 text-sm outline-none focus:border-[var(--cor_destaque_secundaria)]"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--cor_fundo_botao)] px-4 text-sm font-medium text-[var(--cor_texto_claro)]"
              >
                Entrar
              </button>
            </form>

            <form action={signUpAction} className="rounded-lg bg-[var(--cor_fundo_secundaria)] p-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Criar conta</h2>
                <p className="text-sm text-[var(--cor_escura_primaria)]/80">
                  O sistema cria uma senha provisoria e exige troca no primeiro acesso.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm">Nome</span>
                  <input
                    name="fullName"
                    type="text"
                    required
                    className="h-11 w-full rounded-md border border-[var(--cor_escura_primaria)]/15 bg-[var(--cor_fundo_primaria)] px-3 text-sm outline-none focus:border-[var(--cor_destaque_secundaria)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm">E-mail</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="h-11 w-full rounded-md border border-[var(--cor_escura_primaria)]/15 bg-[var(--cor_fundo_primaria)] px-3 text-sm outline-none focus:border-[var(--cor_destaque_secundaria)]"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--cor_fundo_botao)] px-4 text-sm font-medium text-[var(--cor_texto_claro)]"
              >
                Criar conta e gerar senha provisoria
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
