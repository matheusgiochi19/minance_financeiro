import { DashboardCharts } from "@/components/dashboard-charts";
import { MonthFilter } from "@/components/month-filter";
import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard";
import { getCurrentProfile } from "@/lib/profiles";
import { getPeriodoMes } from "@/services/finance.service";

type DashboardPageProps = { searchParams: Promise<{ mes?: string }> };

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const periodo = getPeriodoMes(params.mes);
  const [data, { profile, user }] = await Promise.all([getDashboardData(periodo.mes), getCurrentProfile()]);
  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Minance";

  return (
    <section className="dashboard">
      <div className="welcome">
        <p>Boas-vindas</p>
        <h1>{displayName}</h1>
        <span>Visao consolidada do periodo selecionado.</span>
      </div>
      <MonthFilter month={periodo.mes} />

      <div className="summary-grid">
        <Card className="summary-card" tone="muted"><span>Saldo Atual</span><strong>{data.formatted.saldo}</strong></Card>
        <Card className="summary-card" tone="income"><span>Receitas</span><strong>{data.formatted.receitas}</strong></Card>
        <Card className="summary-card" tone="expense"><span>Despesas</span><strong>{data.formatted.despesas}</strong></Card>
        <Card className="summary-card" tone="cards"><span>Fatura Cartoes</span><strong>{data.formatted.faturas}</strong></Card>
      </div>

      <DashboardCharts categories={data.categories} insights={data.insights} months={data.months} series={data.series} />
    </section>
  );
}
