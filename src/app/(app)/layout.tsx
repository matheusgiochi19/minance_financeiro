import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Banknote,
  BriefcaseBusiness,
  ChartColumnBig,
  CreditCard,
  Database,
  LayoutDashboard,
  ListTree,
  LogOut,
  Settings,
  Target,
  Wallet,
} from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUsuarioAutenticadoComPerfil } from "@/lib/users";

const navigation = [
  { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/receitas", label: "RECEITAS", icon: Banknote },
  { href: "/despesas", label: "DESPESAS", icon: ChartColumnBig },
  { href: "/cartoes", label: "CARTOES", icon: CreditCard },
  { href: "/orcamentos", label: "ORCAMENTO", icon: Target },
  { href: "/bolsos", label: "BOLSOS", icon: Wallet },
  { href: "/categorias", label: "CATEGORIAS", icon: ListTree },
  { href: "/relatorios", label: "RELATORIOS", icon: BriefcaseBusiness },
  { href: "/dados", label: "DADOS", icon: Database },
];

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  const usuario = await getUsuarioAutenticadoComPerfil(supabase, session.user);

  if (usuario?.senha_provisoria_ativa) {
    redirect("/primeiro-acesso");
  }

  const fullName = usuario?.nome_completo ?? session.user.email?.split("@")[0] ?? "Usuario";

  return (
    <div className="min-h-screen bg-[var(--cor_fundo_primaria)] text-[var(--cor_texto_escuro)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[190px] shrink-0 bg-[#33435A] text-[var(--cor_texto_claro)] lg:flex lg:flex-col">
          <div className="h-[52px] bg-[var(--cor_destaque_secundaria)]" />
          <div className="flex-1 px-6 py-12">
            <nav className="grid gap-6 text-sm font-semibold tracking-[0.04em]">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="inline-flex items-center gap-4 text-[var(--cor_texto_claro)]/92 transition hover:text-[var(--cor_destaque_primaria)]">
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="px-6 pb-8 pt-2 text-center text-3xl text-[var(--cor_fundo_secundaria)]">=</div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-[52px] items-center justify-between bg-[var(--cor_escura_secundaria)] px-4 text-[var(--cor_texto_claro)] sm:px-6">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="h-[52px] w-14 -ml-4 bg-[var(--cor_destaque_secundaria)] sm:-ml-6 lg:hidden" />
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--cor_fundo_secundaria)]">Minance</p>
            </div>

            <div className="flex items-center gap-3">
              <form action={signOutAction}>
                <button type="submit" className="rounded-md bg-transparent p-2 text-[var(--cor_texto_claro)]" aria-label="Sair">
                  <LogOut className="size-5" />
                </button>
              </form>
              <button type="button" className="rounded-md bg-transparent p-2 text-[var(--cor_texto_claro)]" aria-label="Configuracoes">
                <Settings className="size-5" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--cor_fundo_secundaria)] bg-[var(--cor_fundo_botao)] text-xs font-semibold">
                {getInitials(fullName)}
              </div>
            </div>
          </header>

          <main className="flex-1 bg-[var(--cor_fundo_primaria)] px-6 py-7 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
