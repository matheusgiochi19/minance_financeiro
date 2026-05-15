"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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
import { APP_VERSION } from "@/lib/version";

const baseNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/app/dashboard" },
  { label: "Receitas", icon: CircleDollarSign, href: "/app/receitas" },
  { label: "Despesas", icon: BarChart3, href: "/app/despesas" },
  { label: "Cartões", icon: CreditCard, href: "/app/cartoes" },
  { label: "Orçamento", icon: ShoppingCart, href: "/app/orcamento" },
  { label: "Bolsos", icon: WalletCards, href: "/app/bolsos" },
  { label: "Categorias", icon: Shapes, href: "/app/categorias" },
  { label: "Relatórios", icon: ReceiptText, href: "/app/relatorios" },
  { label: "Dados", icon: Database, href: "/app/dados" }
];

type AppShellProps = {
  avatarUrl?: string | null;
  children: ReactNode;
  fullName?: string | null;
  role: AppRole;
};

export function AppShell({ avatarUrl, children, fullName, role }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(avatarUrl || null);
  const [profileName, setProfileName] = useState<string | null>(fullName || null);
  const pathname = usePathname();
  const navItems = role === "master" ? [...baseNavItems, { label: "Admin", icon: Shield, href: "/app/admin" }] : baseNavItems;
  const displayName = profileName?.trim() || "Usuário";
  const initial = displayName.slice(0, 1).toUpperCase();

  useEffect(() => {
    let active = true;

    const hydrateProfile = async () => {
      const response = await fetch("/app/api/profile", { cache: "no-store" });
      if (!response.ok || !active) return;
      const profile = (await response.json()) as { avatarUrl: string | null; fullName: string | null };
      setProfileAvatarUrl(profile.avatarUrl);
      setProfileName(profile.fullName);
      console.log("[avatar-debug] navbar-avatar", profile.avatarUrl);
      console.log("[avatar-navbar-render]", profile.avatarUrl);
      console.info("[avatar-navbar]", { hasAvatar: Boolean(profile.avatarUrl) });
    };

    hydrateProfile().catch(() => undefined);
    window.addEventListener("minance:profile-refresh", hydrateProfile);
    return () => {
      active = false;
      window.removeEventListener("minance:profile-refresh", hydrateProfile);
    };
  }, []);

  return (
    <div className={`app-frame ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <Image alt="Minance" height={42} priority src="/Minance_Icone.png" width={42} />
          <span>Minance</span>
        </div>
        <nav aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link className={`nav-link ${active ? "active" : ""}`} href={item.href} key={item.href} title={item.label}>
                <Icon aria-hidden size={22} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button
            aria-label={collapsed ? "Expandir sidebar" : "Reduzir sidebar"}
            className="sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "Expandir" : "Reduzir"}
            type="button"
          >
            <Menu aria-hidden size={24} />
          </button>
          <span className="app-version">{APP_VERSION}</span>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <form action={signOut}>
            <button aria-label="Sair" className="icon-button" type="submit">
              <LogOut size={20} />
            </button>
          </form>
          <Link aria-label="Configurações" className="icon-button" href="/app/configuracoes">
            <Settings size={20} />
          </Link>
          <Link className="user-chip" href="/app/perfil" title={displayName}>
            {profileAvatarUrl ? <Image alt="" className="avatar avatar-image" height={42} src={profileAvatarUrl} width={42} /> : <div className="avatar">{initial}</div>}
            <span>{displayName}</span>
          </Link>
        </header>
        <main className="app-surface">{children}</main>
      </div>
    </div>
  );
}
