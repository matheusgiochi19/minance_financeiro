import { BarChart3, CreditCard, PiggyBank, WalletCards, type LucideIcon } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard-charts";
import { MonthFilter } from "@/components/month-filter";
import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard";
import { getCurrentProfile } from "@/lib/profiles";
import { getPeriodoMes } from "@/services/finance.service";

type DashboardPageProps = { searchParams: Promise<{ mes?: string }> };

type SummaryCard = {
  Icon: LucideIcon;
  label: string;
  note: string;
  tone: "muted" | "income" | "expense" | "cards";
  value: string;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const periodo = getPeriodoMes(params.mes);
  const [data, { profile, user }] = await Promise.all([getDashboardData(periodo.mes), getCurrentProfile()]);
  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Minance";

  const summaryCards: SummaryCard[] = [
    {
      Icon: WalletCards,
      label: "Saldo Atual",
      note: "Disponível no período selecionado",
      tone: "muted",
      value: data.formatted.saldo
    },
    {
      Icon: PiggyBank,
      label: "Receitas",
      note: "Entradas confirmadas no mês",
      tone: "income",
      value: data.formatted.receitas
    },
    {
      Icon: BarChart3,
      label: "Despesas",
      note: "Saídas lançadas no período",
      tone: "expense",
      value: data.formatted.despesas
    },
    {
      Icon: CreditCard,
      label: "Fatura Cartões",
      note: "Compromissos do mês atual",
      tone: "cards",
      value: data.formatted.faturas
    }
  ];

  return (
    <section className="dashboard">
      <header className="dashboard-hero ui-card ui-card-default">
        <div className="dashboard-hero-copy">
          <p>Boas-vindas</p>
          <h1>{displayName}</h1>
          <span>Visão consolidada do período selecionado.</span>
        </div>
        <MonthFilter month={periodo.mes} />
      </header>

      <div className="summary-grid dashboard-summary-grid">
        {summaryCards.map(({ Icon, label, note, tone, value }) => (
          <Card className="summary-card dashboard-summary-card" key={label} tone={tone}>
            <div className="summary-card-icon">
              <Icon aria-hidden size={20} />
            </div>
            <div className="summary-card-copy">
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
          </Card>
        ))}
      </div>

      <DashboardCharts categories={data.categories} insights={data.insights} months={data.months} series={data.series} />
    </section>
  );
}
