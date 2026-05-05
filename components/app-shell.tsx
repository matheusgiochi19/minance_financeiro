"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  CircleDollarSign,
  CreditCard,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Shield,
  Shapes,
  ShoppingCart,
  WalletCards
} from "lucide-react";
import { signOut } from "@/app/auth-actions";
import type { AppRole } from "@/lib/profiles";

const baseNavItems = [
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
  role: AppRole;
  userEmail?: string | null;
};

export function AppShell({ children, role, userEmail }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navItems = role === "master" ? [...baseNavItems, { label: "Admin", icon: Shield, href: "/app/admin" }] : baseNavItems;

  return (
    <div className={`app-frame ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <Image alt="Minance" height={42} priority src="/Minance_Icone.png" width={42} />
          <span>Minance</span>
        </div>
        <nav aria-label="Navegacao principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="nav-link" href={item.href} key={item.href} title={item.label}>
                <Icon aria-hidden size={22} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          aria-label={collapsed ? "Expandir sidebar" : "Reduzir sidebar"}
          className="sidebar-toggle"
          onClick={() => setCollapsed((value) => !value)}
          title={collapsed ? "Expandir" : "Reduzir"}
          type="button"
        >
          <Menu aria-hidden size={24} />
        </button>
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
        <main className="app-surface">{children}</main>
      </div>
    </div>
  );
}
