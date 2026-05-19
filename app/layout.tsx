import type { Metadata } from "next";
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
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("minance-theme");if(t==="dark"){document.documentElement.classList.add("dark");document.body.classList.add("dark");document.documentElement.dataset.theme="dark";document.body.dataset.theme="dark";}}catch(e){}`
          }}
        />
        {children}
      </body>
    </html>
  );
}
