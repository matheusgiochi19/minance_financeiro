import type { Metadata } from "next";
import { ThemeBoot } from "@/components/theme-boot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minance - Gestão Financeira Pessoal",
  description: "SaaS de gestão financeira pessoal.",
  icons: {
    icon: "/Minance_Icone.png",
    shortcut: "/Minance_Icone.png",
    apple: "/Minance_Icone.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeBoot />
        {children}
      </body>
    </html>
  );
}
