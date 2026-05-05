import Link from "next/link";
import { BarChart3, CircleDollarSign, CreditCard, Database, LayoutDashboard, LogOut, Menu, ReceiptText, Settings, Shapes, ShoppingCart, WalletCards } from "lucide-react";
import { signOut } from "@/app/auth-actions";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/app/dashboard" },
  { label: "Receitas", icon: CircleDollarSign, href: "/app/receitas" },
  { label: "Despesas", icon: BarChart3, href: "/app/despesas" },
  { label: "Cartoes", icon: CreditCard, href: "/app/cartoes" },
  { label: "Orcamento", icon: ShoppingCart, href: "/app/orcamento" },
  { label: "Bolsos", icon: WalletCards, href: "/app/bolsos" },
  { label: "Categorias", icon: Shapes, href: "/app/categorias" },
  { label: "Relatorios", icon: ReceiptText, href: "/app/relatorios" },
  { label: "Dados", icon: Database, href: "/app/dados" }
];

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-block" />
        <nav aria-label="Navegacao principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="nav-link" href={item.href} key={item.href}>
                <Icon aria-hidden size={22} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Menu aria-hidden className="sidebar-menu" size={24} />
      </aside>
      <div className="app-content">
        <header className="topbar">
          <form action={signOut}>
            <button aria-label="Sair" className="icon-button" type="submit">
              <LogOut size={20} />
            </button>
          </form>
          <button aria-label="Configuracoes" className="icon-button" type="button">
            <Settings size={20} />
          </button>
          <div className="avatar" title={userEmail || "Usuario"}>
            {userEmail?.slice(0, 1).toUpperCase() || "M"}
          </div>
        </header>
        <main className="striped-surface">{children}</main>
      </div>
    </div>
  );
}
